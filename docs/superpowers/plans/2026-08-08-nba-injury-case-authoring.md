# NBA Injury Case Authoring — 26-Case G3 Implementation Plan

> Status: NOT AUTHORIZED. This Task 6 artifact freezes a future implementation plan only. It creates no case JSON, teaching content, medical conclusion, review decision, hosted environment, release, or indexable page.

## Scope and authority

- Execution role: `nba-injury-case-authoring`; execution scope ID: `nba-medical-content-authoring-only`; required closed scope IDs: `private-hosting`, `public-release`, `deployment`.
- Current authority ends after this plan and its `not-authorized` binding are committed as the G2 Task 6 handoff. None of the implementation tasks below may run in the current cycle.
- A later executor must first bind an exact user decision to this plan's bytes, then pass `npm run plan:verify` and `npm run plan:assert-authorized -- "docs/superpowers/plans/2026-08-08-nba-injury-case-authoring.md"` under Node 24.14.0 from a clean worktree.
- Medical content authoring and medical review are not being performed now. The future authorized G3 work must stop with records awaiting named medical review; no agent may fill reviewer identity, qualification, reviewed time, approved digest, or a medical approval decision.
- Private hosting, public release, deployment, DNS, analytics, indexing, remote creation, push, and media download/reupload remain outside this plan. Source-verified does not mean medically approved, rights-cleared, hosted, public, or safe to index.
- Do not rerun the mutable live source verifier in this plan. The frozen Task 5 bytes remain the source-of-truth; original-page video inspection is a future per-case authoring step only and cannot rewrite G2 artifacts.

## Immutable Task 5 source binding

- Task 5 commit: `e26d24c6288c73df8733f0aaf9e60177c778e965` (`research: freeze NBA authoring manifest`).
- Manifest: `research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json`; ID `NBA-SOURCE-2026-08-06-001`; SHA-256 `8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d`.
- Source-review decision: `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json`; SHA-256 `cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c`.
- Registry: `research/source-manifest-registry.v1.json`; post-append bytes SHA-256 `0e1b0279eabc5c0dccee52cf498242242acd3c38801056b4a213369bb4b3fc30`; trusted previous-registry-bytes SHA-256 `eaf741c591ae9eb798b55a703ddadfeec7c803b91b3199272a7ccd39e56160c1`.
- Policy: `nba-v2`; candidate-set SHA-256 `c217953f242492a1e84291e40c592a5fa4824edcde0434733bccb41622add8e5`; policy JSON SHA-256 `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07`; policy Markdown SHA-256 `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570`.
- Named source review: 吳易澄醫師, `2026-08-07T15:31:19Z`. The durable decision status is `approved-for-manifest`; the canonical manifest projects that frozen decision as `approved-for-authoring`. Both are source-curation states, not medical review.
- Frozen composition: 26 cases; ACL 7, ankle sprain 12, Achilles rupture 7; recent 26; classic 0; external-link-only 25; verified embed 1.
- These 26 entries may be planned for G3 authoring, but they do not satisfy the unchanged site/public corpus floors of at least 10 cases per injury and at least 30 total: ACL and Achilles each remain at 7, and the total remains 26. G3 completion therefore cannot be treated as public-launch readiness. A later separately authorized source batch must close those gaps; this plan must not lower, bypass, or relabel the existing 10/30 gates.
- Decision 3 applies only to this exact launch manifest's G2 classic-presence floor. It does not relax G3 schemas, source binding, evidence, medical review, hosting, release, or indexing gates.
- A later unreferenced quarterly batch cannot change this plan's 26-case coverage or any binding/digest above. Corrections require a separately authorized plan and explicit supersession handling.

### Exact registry entry

```json
{
  "batchType": "launch",
  "createdAt": "2026-08-07T15:31:19Z",
  "manifestDigest": "8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d",
  "manifestId": "NBA-SOURCE-2026-08-06-001",
  "manifestPath": "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json",
  "period": "2026-08-06",
  "previousRegistryBytesDigest": "eaf741c591ae9eb798b55a703ddadfeec7c803b91b3199272a7ccd39e56160c1",
  "sourcePolicyVersion": "nba-v2",
  "sourceReviewDecisionDigest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
  "sourceReviewDecisionPath": "research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json",
  "supersedes": []
}
```

### Exact Task 5 source-artifact digests

```json
{
  "achillesRuptureCsvSha256": "9dfda35317485f40bd5bf8798da30f3cf3f639111b1e332ff5b3e39bede909ad",
  "aclCsvSha256": "4fe56848a411796a11438c9149c7a233d26c184ada47b1dbf4bcf1d0516036a4",
  "ankleSprainCsvSha256": "a0d7155ad168396e218d8079e698dfc2938f5b19f1f1924defd8df673232c15a",
  "rootAuditSha256": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
  "sourcePolicyJsonSha256": "6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07",
  "sourcePolicyMarkdownSha256": "b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570",
  "sourceReviewDecisionSha256": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
  "verificationArtifactSha256": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0"
}
```

## Deterministic identities and immutable mapping rules

- Stable case IDs are injury-namespaced: ACL uses `CASE-NBAACL-<event year>-<candidate suffix>`, ankle sprain uses `CASE-NBAANKLE-<event year>-<candidate suffix>`, and Achilles rupture uses `CASE-NBAACHILLES-<event year>-<candidate suffix>`. The frozen set is 26/26 globally unique and every ID matches `^CASE-[A-Z0-9]+-[0-9]{4}-[0-9]{3}$`.
- Final slugs use `<athlete>-<injury-code>-<event-year>`; every slug is lower-kebab and unique in this set. The case filename must be exactly `${slug}.json`; each final path below is therefore authoritative.
- The machine-readable block is the audit source for candidate, case, slug, path, entry digest, exact manifest source records, and exact frozen provenance. It deliberately omits the manifest diagnosis-claim text so this planning-only handoff does not author or restate medical content; the entry digest still binds the entire immutable entry.
- Planned source IDs are globally namespaced by candidate. Future teaching-evidence IDs append a deterministic two-digit suffix to the listed prefix after current primary research is selected. IDs do not grant support: each source type may support only contract-compatible paths.

## Future execution preflight

Run this only after a separate exact authorization decision has been created and bound:

```bash
node --version
test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain)"
npm run plan:verify
npm run plan:assert-authorized -- "docs/superpowers/plans/2026-08-08-nba-injury-case-authoring.md"
npm run research:check-manifest
npm run research:registry:check
npm run research:digest
```

Expected: all commands exit 0, the digest command returns the bound manifest digest, and the worktree is still clean. Any mismatch stops execution; it does not authorize a manifest rewrite or live-verifier rerun.

Calendar hard stop: if separately authorized execution begins after `2026-09-30`, stop before any content edit. Create a replacement current-quarter plan, bind its new digest as `not-authorized`, obtain a matching authorization, and re-run the preflight; do not repurpose this `2026-q3` baseline.

## Task 1: Add rich canonical case-binding support first (red → green)

**Files:**

- Modify: `src/lib/contracts/cross-validation.ts`
- Modify only if a shared parser/type export is required: `src/lib/research/candidate-manifest.ts` and/or `src/lib/contracts/source-manifest-registry.ts`
- Modify: `tests/unit/case-cross-validation.test.ts`

1. First add a failing test proving `validateCaseSourceBinding()` can resolve this registered rich canonical manifest and canonical source-review decision. It must verify manifest/decision/entry digests and map the rich entry's frozen candidate, event, diagnosis-source, event-source, and video-source facts without accepting drift.
2. Preserve every legacy `sourceBatchManifestSchema` and legacy source-review-decision fixture test. Select the parser by strict successful schema recognition; do not loosen either schema, coerce malformed artifacts, bypass registry resolution, accept test/fixture paths in production, or turn a parse failure into a pass.
3. Add rich-manifest negative tests for stale manifest/decision/entry digests, missing/duplicate candidate IDs, wrong candidate identity, source URL/provider/uploader drift, source-policy mismatch, unapproved source status/review, superseded entries, malformed canonical decision, and cross-format confusion.
4. The rich manifest contains no duration or authoring time window. Remove no runtime bounds: duration, start/end, and segment ordering must remain schema/cross-validation checked, but they must be derived only by later authorized inspection of the original video page. Never fabricate them from the frozen manifest, publication date, title, or verifier metadata.
5. Run the focused cross-validation tests before authoring any real case:

```bash
npx vitest run tests/unit/case-cross-validation.test.ts tests/unit/source-manifest-registry.test.ts tests/unit/research-manifest.test.ts
npm run content:check
```

Expected: new rich canonical fixtures and all legacy fail-closed cases pass. No real case file exists yet.

## Task 2: Freeze and test plan-to-manifest one-to-one coverage

**Files:**

- Create: `scripts/check-case-authoring-coverage.ts`
- Create: `tests/unit/case-authoring-coverage.test.ts`
- Read: `docs/superpowers/plans/2026-08-08-nba-injury-case-authoring.md`

1. Extract only the marked JSON block below and parse it strictly. Resolve the manifest through the registry, verify all bound bytes/digests, and compare the frozen source/provenance projection field-for-field.
2. Require exactly 26 unique candidate IDs, task IDs, case IDs, slugs, and paths; exactly one case for every manifest entry; no extra case; matching entry digests; and filenames exactly equal to `${slug}.json`.
3. Require exactly the three listed overview paths and exactly one `2026-q3` baseline path/period. Reject duplicate, missing, reordered-with-drift, stale, or hand-edited source records.
4. Keep this checker scoped to this plan's immutable launch batch. An unreferenced quarterly append must not alter its expected set.

```bash
npx vitest run tests/unit/case-authoring-coverage.test.ts
npx tsx scripts/check-case-authoring-coverage.ts
```

## Task 3: Author 7 ACL cases after authorization

**Final files and one-to-one authoring tasks:**

- [ ] `case-acl-01` — `CAND-NBA-ACL-2021-009` → `CASE-NBAACL-2021-009`; slug `markelle-fultz-acl-2021`; create `src/content/cases/markelle-fultz-acl-2021.json`.
  - Frozen identity: Markelle Fultz; 2021-01-06; Orlando Magic vs. Cleveland Cavaliers; nba-regular-season; season 2020-21.
  - Exact source pointers: video `https://www.nba.com/watch/video/markelle-fultz-goes-down-with-leg-injury`; diagnosis `https://www.nba.com/magic/news/magic-sweep-mini-series-against-cavs-lose-markelle-fultz-torn-acl-20210106`; event `https://www.nba.com/watch/video/markelle-fultz-goes-down-with-leg-injury`.
  - Exact provenance pointers: entry `db773859e92bc9fbb83c0971b3d010a1372dcf8b7ab5b8abdc333a066c24196b`; root audit `/candidates/0`; verifier results `/results/0`, `/results/1`, `/results/2`, `/results/3`.

- [ ] `case-acl-02` — `CAND-NBA-ACL-2021-010` → `CASE-NBAACL-2021-010`; slug `thomas-bryant-acl-2021`; create `src/content/cases/thomas-bryant-acl-2021.json`.
  - Frozen identity: Thomas Bryant; 2021-01-09; Washington Wizards vs. Miami Heat; nba-regular-season; season 2020-21.
  - Exact source pointers: video `https://www.nba.com/watch/video/thomas-bryant-leaves-with-leg-injury`; diagnosis `https://www.nba.com/wizards/thomas-bryant-injury-update-1-10-21`; event `https://www.nba.com/watch/video/thomas-bryant-leaves-with-leg-injury`.
  - Exact provenance pointers: entry `cd1b96124e29f9c20f5cc50305c7b4a22a1c0777435a99b9410be44ffefd68cc`; root audit `/candidates/1`; verifier results `/results/4`, `/results/5`, `/results/6`, `/results/7`.

- [ ] `case-acl-03` — `CAND-NBA-ACL-2021-015` → `CASE-NBAACL-2021-015`; slug `ricky-rubio-acl-2021`; create `src/content/cases/ricky-rubio-acl-2021.json`.
  - Frozen identity: Ricky Rubio; 2021-12-28; Cleveland Cavaliers vs. New Orleans Pelicans; nba-regular-season; season 2021-22.
  - Exact source pointers: video `https://www.nba.com/watch/video/20211228rubioinjury`; diagnosis `https://www.nba.com/cavaliers/releases/rubio-status-update-211229`; event `https://www.nba.com/watch/video/20211228rubioinjury`.
  - Exact provenance pointers: entry `91575f6d096e475980f878b8268828c16a2589c0a0fb30977eff10817217d34b`; root audit `/candidates/2`; verifier results `/results/8`, `/results/9`, `/results/10`, `/results/11`.

- [ ] `case-acl-04` — `CAND-NBA-ACL-2022-016` → `CASE-NBAACL-2022-016`; slug `joe-ingles-acl-2022`; create `src/content/cases/joe-ingles-acl-2022.json`.
  - Frozen identity: Joe Ingles; 2022-01-30; Utah Jazz vs. Minnesota Timberwolves; nba-regular-season; season 2021-22.
  - Exact source pointers: video `https://www.nba.com/watch/video/20220130joeinglesinjury`; diagnosis `https://www.nba.com/jazz/news/joe-ingles-injury-update`; event `https://www.nba.com/watch/video/20220130joeinglesinjury`.
  - Exact provenance pointers: entry `eb6f20e796d38445426a575ca229812845e6f77b9c788c5a78714024abb15e6a`; root audit `/candidates/3`; verifier results `/results/12`, `/results/13`, `/results/14`, `/results/15`.

- [ ] `case-acl-05` — `CAND-NBA-ACL-2022-017` → `CASE-NBAACL-2022-017`; slug `danny-green-acl-2022`; create `src/content/cases/danny-green-acl-2022.json`.
  - Frozen identity: Danny Green; 2022-05-12; Philadelphia 76ers vs. Miami Heat; nba-playoffs; season 2021-22.
  - Exact source pointers: video `https://www.nba.com/watch/video/danny-green-leaves-the-game-due-to-injury`; diagnosis `https://www.nba.com/news/76ers-guard-danny-green-exits-game-6-with-left-knee-injury`; event `https://www.nba.com/watch/video/danny-green-leaves-the-game-due-to-injury`.
  - Exact provenance pointers: entry `a4e3c3c13c5eeb024c757f670c6156fe9e0f12d077cb3af5f9289f7e12f5800d`; root audit `/candidates/4`; verifier results `/results/16`, `/results/17`, `/results/18`, `/results/19`.

- [ ] `case-acl-06` — `CAND-NBA-ACL-2024-023` → `CASE-NBAACL-2024-023`; slug `moritz-wagner-acl-2024`; create `src/content/cases/moritz-wagner-acl-2024.json`.
  - Frozen identity: Moritz Wagner; 2024-12-21; Orlando Magic vs. Miami Heat; nba-regular-season; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/moritz-wagner-left-knee-injury-heat-magic-dec-21`; diagnosis `https://www.nba.com/magic/news/orlando-magic-center-moe-wagner-suffers-torn-acl-injury-update-20241222`; event `https://www.nba.com/watch/video/moritz-wagner-left-knee-injury-heat-magic-dec-21`.
  - Exact provenance pointers: entry `ff8f7d6da7b63c2e470ac04a4405fe2ab5ffc30e47154147e7a305ff46d2a39e`; root audit `/candidates/5`; verifier results `/results/20`, `/results/21`, `/results/22`, `/results/23`.

- [ ] `case-acl-07` — `CAND-NBA-ACL-2025-021` → `CASE-NBAACL-2025-021`; slug `kyrie-irving-acl-2025`; create `src/content/cases/kyrie-irving-acl-2025.json`.
  - Frozen identity: Kyrie Irving; 2025-03-03; Dallas Mavericks vs. Sacramento Kings; nba-regular-season; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/kyrie-irving-left-knee-sprain-injury-kings-mavericks-march-3`; diagnosis `https://www.nba.com/news/kyrie-irving-knee-injury-mavericks-kings`; event `https://www.nba.com/watch/video/kyrie-irving-left-knee-sprain-injury-kings-mavericks-march-3`.
  - Exact provenance pointers: entry `149c643c561b5fe8b03bdf76a5f322c42fd5947b58799ecdafdfaef8cfe7b51e`; root audit `/candidates/6`; verifier results `/results/24`, `/results/25`, `/results/26`, `/results/27`.

**Per-case red → green procedure:**

1. Add the case to the coverage/content/route assertions first and observe the missing-file failure. Create only its listed path; never rename or alias a frozen candidate.
2. Copy all source identity and binding facts from the machine-readable projection and registry-resolved manifest. Do not infer a diagnosis, grade, imaging result, surgery, prognosis, rehabilitation duration, or return date from a video, title, commentary, or search snippet.
3. In the original-platform page, record the actual duration, a bounded start/end window, and ordered visible-only segments. Recheck that every timestamp is within the observed duration and that fallback behavior matches the frozen embed status. This inspection must not mutate G2 verification artifacts.
4. Separate event context, visible observation, externally documented diagnosis, and professional teaching. Select current primary research/guidelines during authorized authoring; create atomic professional claims with compatible `teaching-evidence` support. Do not copy a course unit or an individualized/phase-by-phase RTP prescription.
5. Keep `video.publicRightsReview.status: not-requested`. Finish the record with `status: medical-review` and `review.status: in-review`; set `reviewerName`, `reviewerQualification`, `reviewedAt`, and `reviewedContentDigest` exactly to `null`. The authoring agent may compute content/video digests for handoff but may not place them in an approval field or approve the record.
6. Run schema, filename, global-ID, binding, evidence-support, timecode, digest, selector, route, and review-build tests before committing this mutually exclusive set of paths.

## Task 4: Author 12 ankle-sprain cases after authorization

**Final files and one-to-one authoring tasks:**

- [ ] `case-ankle-01` — `CAND-NBA-ANKLE-2020-002` → `CASE-NBAANKLE-2020-002`; slug `cj-mccollum-ankle-sprain-2020`; create `src/content/cases/cj-mccollum-ankle-sprain-2020.json`.
  - Frozen identity: CJ McCollum; 2020-01-17; Portland Trail Blazers vs. Dallas Mavericks; nba-regular-season; season 2019-20.
  - Exact source pointers: video `https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury`; diagnosis `https://www.nba.com/news/cj-mccollum-exits-left-ankle-sprain`; event `https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury`.
  - Exact provenance pointers: entry `29f20a3b517cce71bfba4599a1b0833abe6ab3096c4cd7409e3af90dd8dbad49`; root audit `/candidates/7`; verifier results `/results/28`, `/results/29`, `/results/30`, `/results/31`.

- [ ] `case-ankle-02` — `CAND-NBA-ANKLE-2020-001` → `CASE-NBAANKLE-2020-001`; slug `ja-morant-ankle-sprain-2020`; create `src/content/cases/ja-morant-ankle-sprain-2020.json`.
  - Frozen identity: Ja Morant; 2020-12-28; Memphis Grizzlies vs. Brooklyn Nets; nba-regular-season; season 2020-21.
  - Exact source pointers: video `https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair`; diagnosis `https://www.nba.com/news/ja-morant-out-3-5-weeks-with-grade-2-ankle-sprain`; event `https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair`.
  - Exact provenance pointers: entry `dfdc6d3f7bc1701072fe4bde1c479bb1cfe20d437166f250b72be8e2418f6889`; root audit `/candidates/8`; verifier results `/results/32`, `/results/33`, `/results/34`, `/results/35`.

- [ ] `case-ankle-03` — `CAND-NBA-ANKLE-2021-003` → `CASE-NBAANKLE-2021-003`; slug `lebron-james-ankle-sprain-2021`; create `src/content/cases/lebron-james-ankle-sprain-2021.json`.
  - Frozen identity: LeBron James; 2021-03-20; Los Angeles Lakers vs. Atlanta Hawks; nba-regular-season; season 2020-21.
  - Exact source pointers: video `https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return`; diagnosis `https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return`; event `https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return`.
  - Exact provenance pointers: entry `c9d1c68f9edcbdba4c677b5dc1f994779a9d35d756c492ac5a9f823d9b169f6e`; root audit `/candidates/9`; verifier results `/results/36`, `/results/37`, `/results/38`, `/results/39`.

- [ ] `case-ankle-04` — `CAND-NBA-ANKLE-2021-001` → `CASE-NBAANKLE-2021-001`; slug `trae-young-ankle-sprain-2021`; create `src/content/cases/trae-young-ankle-sprain-2021.json`.
  - Frozen identity: Trae Young; 2021-04-21; Atlanta Hawks vs. New York Knicks; nba-regular-season; season 2020-21.
  - Exact source pointers: video `https://www.nba.com/watch/video/traeinjuryvsknicks`; diagnosis `https://www.nba.com/news/report-trae-youngs-ankle-injury-not-considered-serious`; event `https://www.nba.com/watch/video/traeinjuryvsknicks`.
  - Exact provenance pointers: entry `cb2b83513cd89aa618916ac61700b97163b7b39fb0943f18e2d41dd6a16eed58`; root audit `/candidates/10`; verifier results `/results/40`, `/results/41`, `/results/42`, `/results/43`.

- [ ] `case-ankle-05` — `CAND-NBA-ANKLE-2021-002` → `CASE-NBAANKLE-2021-002`; slug `kyrie-irving-ankle-sprain-2021`; create `src/content/cases/kyrie-irving-ankle-sprain-2021.json`.
  - Frozen identity: Kyrie Irving; 2021-06-13; Brooklyn Nets vs. Milwaukee Bucks; nba-playoffs; season 2020-21.
  - Exact source pointers: video `https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain`; diagnosis `https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain`; event `https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain`.
  - Exact provenance pointers: entry `0a89a3fef7d984f32fe7b8ef22b983b305f9c74a6f5bb6f83c1963e4fe115e11`; root audit `/candidates/11`; verifier results `/results/44`, `/results/45`, `/results/46`, `/results/47`.

- [ ] `case-ankle-06` — `CAND-NBA-ANKLE-2022-001` → `CASE-NBAANKLE-2022-001`; slug `lamelo-ball-ankle-sprain-2022`; create `src/content/cases/lamelo-ball-ankle-sprain-2022.json`.
  - Frozen identity: LaMelo Ball; 2022-11-16; Charlotte Hornets vs. Indiana Pacers; nba-regular-season; season 2022-23.
  - Exact source pointers: video `https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury`; diagnosis `https://www.nba.com/news/lamelo-ball-reinjures-ankle-after-stepping-on-fans-foot`; event `https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury`.
  - Exact provenance pointers: entry `fa712ba7e930b082b6648645e6fcce7773874407d2371a42f2d4251103f17316`; root audit `/candidates/12`; verifier results `/results/48`, `/results/49`, `/results/50`, `/results/51`.

- [ ] `case-ankle-07` — `CAND-NBA-ANKLE-2023-004` → `CASE-NBAANKLE-2023-004`; slug `anfernee-simons-ankle-sprain-2023`; create `src/content/cases/anfernee-simons-ankle-sprain-2023.json`.
  - Frozen identity: Anfernee Simons; 2023-02-14; Portland Trail Blazers vs. Washington Wizards; nba-regular-season; season 2022-23.
  - Exact source pointers: video `https://www.nba.com/watch/video/anfernee-simons-leaves-the-game-due-to-injury`; diagnosis `https://www.nba.com/news/blazers-anfernee-simons-injury-update`; event `https://www.nba.com/watch/video/anfernee-simons-leaves-the-game-due-to-injury`.
  - Exact provenance pointers: entry `41c20c51b043257c9a516c7197e000343e26328dea5a161f0083da3b21b3c0c9`; root audit `/candidates/13`; verifier results `/results/52`, `/results/53`, `/results/54`, `/results/55`.

- [ ] `case-ankle-08` — `CAND-NBA-ANKLE-2023-001` → `CASE-NBAANKLE-2023-001`; slug `anthony-edwards-ankle-sprain-2023`; create `src/content/cases/anthony-edwards-ankle-sprain-2023.json`.
  - Frozen identity: Anthony Edwards; 2023-03-17; Minnesota Timberwolves vs. Chicago Bulls; nba-regular-season; season 2022-23.
  - Exact source pointers: video `https://www.youtube.com/watch?v=V9mtX4mE8wQ`; diagnosis `https://www.nba.com/news/anthony-edwards-sprains-right-ankle-exits-early-vs-bulls`; event `https://www.youtube.com/watch?v=V9mtX4mE8wQ`.
  - Exact provenance pointers: entry `1143ef138f4838fd6ec7607b504d54bbfbd661a69a2995568b1b465a71cfbcc7`; root audit `/candidates/14`; verifier results `/results/56`, `/results/57`, `/results/58`, `/results/59`.

- [ ] `case-ankle-09` — `CAND-NBA-ANKLE-2023-008` → `CASE-NBAANKLE-2023-008`; slug `lamelo-ball-ankle-sprain-2023`; create `src/content/cases/lamelo-ball-ankle-sprain-2023.json`.
  - Frozen identity: LaMelo Ball; 2023-11-26; Charlotte Hornets vs. Orlando Magic; nba-regular-season; season 2023-24.
  - Exact source pointers: video `https://www.nba.com/watch/video/lamelo-ball-leaves-the-game-with-a-right-leg-injury`; diagnosis `https://www.nba.com/news/hornets-lamelo-ball-out-right-ankle-strain`; event `https://www.nba.com/watch/video/lamelo-ball-leaves-the-game-with-a-right-leg-injury`.
  - Exact provenance pointers: entry `cd2cfe1c8e310969f80f2b5379eb34345f113a9e8e43c1cb00f4f09f52481276`; root audit `/candidates/15`; verifier results `/results/60`, `/results/61`, `/results/62`, `/results/63`.

- [ ] `case-ankle-10` — `CAND-NBA-ANKLE-2024-001` → `CASE-NBAANKLE-2024-001`; slug `kevin-durant-ankle-sprain-2024`; create `src/content/cases/kevin-durant-ankle-sprain-2024.json`.
  - Frozen identity: Kevin Durant; 2024-12-03; Phoenix Suns vs. San Antonio Spurs; nba-regular-season; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/kevin-durant-left-ankle-sprain-injury-suns-spurs-dec-3`; diagnosis `https://www.nba.com/suns/news/12-05-2024-suns-vs-pelicans-game-preview`; event `https://www.nba.com/watch/video/kevin-durant-left-ankle-sprain-injury-suns-spurs-dec-3`.
  - Exact provenance pointers: entry `df8534f96c72b7fd367c950ca93b7c39ffa9bbd22a7f911bfce651d9a6360db3`; root audit `/candidates/16`; verifier results `/results/64`, `/results/65`, `/results/66`, `/results/67`.

- [ ] `case-ankle-11` — `CAND-NBA-ANKLE-2025-002` → `CASE-NBAANKLE-2025-002`; slug `lamelo-ball-ankle-sprain-2025`; create `src/content/cases/lamelo-ball-ankle-sprain-2025.json`.
  - Frozen identity: LaMelo Ball; 2025-01-27; Charlotte Hornets vs. Los Angeles Lakers; nba-regular-season; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27`; diagnosis `https://www.nba.com/news/hornets-lamelo-ball-injury-update`; event `https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27`.
  - Exact provenance pointers: entry `5318b193e5a43baa31fc29c82c47d6ff392cc9e07c0badfde951e577b51f22a8`; root audit `/candidates/17`; verifier results `/results/68`, `/results/69`, `/results/70`, `/results/71`.

- [ ] `case-ankle-12` — `CAND-NBA-ANKLE-2025-001` → `CASE-NBAANKLE-2025-001`; slug `anthony-edwards-ankle-sprain-2025`; create `src/content/cases/anthony-edwards-ankle-sprain-2025.json`.
  - Frozen identity: Anthony Edwards; 2025-04-03; Minnesota Timberwolves vs. Brooklyn Nets; nba-regular-season; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room`; diagnosis `https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3`; event `https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room`.
  - Exact provenance pointers: entry `e839dfeca91387dfa59d7b6add14f1ac2c9aa14df1ffae1d6010616edf2833e8`; root audit `/candidates/18`; verifier results `/results/72`, `/results/73`, `/results/74`, `/results/75`.

**Per-case red → green procedure:**

1. Add the case to the coverage/content/route assertions first and observe the missing-file failure. Create only its listed path; never rename or alias a frozen candidate.
2. Copy all source identity and binding facts from the machine-readable projection and registry-resolved manifest. Do not infer a diagnosis, grade, imaging result, surgery, prognosis, rehabilitation duration, or return date from a video, title, commentary, or search snippet.
3. In the original-platform page, record the actual duration, a bounded start/end window, and ordered visible-only segments. Recheck that every timestamp is within the observed duration and that fallback behavior matches the frozen embed status. This inspection must not mutate G2 verification artifacts.
4. Separate event context, visible observation, externally documented diagnosis, and professional teaching. Select current primary research/guidelines during authorized authoring; create atomic professional claims with compatible `teaching-evidence` support. Do not copy a course unit or an individualized/phase-by-phase RTP prescription.
5. Keep `video.publicRightsReview.status: not-requested`. Finish the record with `status: medical-review` and `review.status: in-review`; set `reviewerName`, `reviewerQualification`, `reviewedAt`, and `reviewedContentDigest` exactly to `null`. The authoring agent may compute content/video digests for handoff but may not place them in an approval field or approve the record.
6. Run schema, filename, global-ID, binding, evidence-support, timecode, digest, selector, route, and review-build tests before committing this mutually exclusive set of paths.

## Task 5: Author 7 Achilles-rupture cases after authorization

**Final files and one-to-one authoring tasks:**

- [ ] `case-achilles-01` — `CAND-NBA-ACHILLES-2019-005` → `CASE-NBAACHILLES-2019-005`; slug `kevin-durant-achilles-rupture-2019`; create `src/content/cases/kevin-durant-achilles-rupture-2019.json`.
  - Frozen identity: Kevin Durant; 2019-06-10; Golden State Warriors vs. Toronto Raptors; nba-playoffs; season 2018-19.
  - Exact source pointers: video `https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury`; diagnosis `https://www.nba.com/news/warriors-durant-achilles-injury-update`; event `https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury`.
  - Exact provenance pointers: entry `d718b475799a1ca3e38a1daeb7c8133ca4c8a93b710d37a315a943d19f4e3d21`; root audit `/candidates/19`; verifier results `/results/76`, `/results/77`, `/results/78`, `/results/79`.

- [ ] `case-achilles-02` — `CAND-NBA-ACHILLES-2020-008` → `CASE-NBAACHILLES-2020-008`; slug `dwight-powell-achilles-rupture-2020`; create `src/content/cases/dwight-powell-achilles-rupture-2020.json`.
  - Frozen identity: Dwight Powell; 2020-01-21; Dallas Mavericks vs. LA Clippers; nba-regular-season; season 2019-20.
  - Exact source pointers: video `https://www.nba.com/watch/video/dwight-powell-injury`; diagnosis `https://www.nba.com/news/dwight-powell-has-surgery-achilles`; event `https://www.nba.com/watch/video/dwight-powell-injury`.
  - Exact provenance pointers: entry `1121b1f4fc21dc562267ca5a104e66f4a733a5e9639cf0bcba225c1a1f88f217`; root audit `/candidates/20`; verifier results `/results/80`, `/results/81`, `/results/82`, `/results/83`.

- [ ] `case-achilles-03` — `CAND-NBA-ACHILLES-2023-010` → `CASE-NBAACHILLES-2023-010`; slug `brandon-clarke-achilles-rupture-2023`; create `src/content/cases/brandon-clarke-achilles-rupture-2023.json`.
  - Frozen identity: Brandon Clarke; 2023-03-03; Memphis Grizzlies vs. Denver Nuggets; nba-regular-season; season 2022-23.
  - Exact source pointers: video `https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury`; diagnosis `https://www.nba.com/grizzlies/news/memphis-grizzlies-medical-update-030423`; event `https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury`.
  - Exact provenance pointers: entry `74c724ef2d554239f43b5df0c2c8137363118b6766e6d0177a15b5fff2ff868d`; root audit `/candidates/21`; verifier results `/results/84`, `/results/85`, `/results/86`, `/results/87`.

- [ ] `case-achilles-04` — `CAND-NBA-ACHILLES-2025-014` → `CASE-NBAACHILLES-2025-014`; slug `dejounte-murray-achilles-rupture-2025`; create `src/content/cases/dejounte-murray-achilles-rupture-2025.json`.
  - Frozen identity: Dejounte Murray; 2025-01-31; New Orleans Pelicans vs. Boston Celtics; nba-regular-season; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31`; diagnosis `https://www.nba.com/news/pelicans-murray-injury`; event `https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31`.
  - Exact provenance pointers: entry `f86897663c4e68cc1449baf8cb9b3cacbbe7c1a28537b03ae8e7f2aa340ed4b7`; root audit `/candidates/22`; verifier results `/results/88`, `/results/89`, `/results/90`, `/results/91`.

- [ ] `case-achilles-05` — `CAND-NBA-ACHILLES-2025-015` → `CASE-NBAACHILLES-2025-015`; slug `damian-lillard-achilles-rupture-2025`; create `src/content/cases/damian-lillard-achilles-rupture-2025.json`.
  - Frozen identity: Damian Lillard; 2025-04-27; Milwaukee Bucks vs. Indiana Pacers; nba-playoffs; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers`; diagnosis `https://www.nba.com/bucks/news/medical-update-on-damian-lillard-3`; event `https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers`.
  - Exact provenance pointers: entry `6edd5cb52a8e2f12e89256a96f84d8fc1c0001979804113e93ec2f0289c9b20c`; root audit `/candidates/23`; verifier results `/results/92`, `/results/93`, `/results/94`, `/results/95`.

- [ ] `case-achilles-06` — `CAND-NBA-ACHILLES-2025-016` → `CASE-NBAACHILLES-2025-016`; slug `jayson-tatum-achilles-rupture-2025`; create `src/content/cases/jayson-tatum-achilles-rupture-2025.json`.
  - Frozen identity: Jayson Tatum; 2025-05-12; Boston Celtics vs. New York Knicks; nba-playoffs; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4`; diagnosis `https://www.nba.com/celtics/news/press-release-20250513-jayson-tatum-injury-update`; event `https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4`.
  - Exact provenance pointers: entry `d9b0468b2b683bed03141a48b8d839fd751d923eb49ca6a98afca713174bc171`; root audit `/candidates/24`; verifier results `/results/96`, `/results/97`, `/results/98`, `/results/99`.

- [ ] `case-achilles-07` — `CAND-NBA-ACHILLES-2025-017` → `CASE-NBAACHILLES-2025-017`; slug `tyrese-haliburton-achilles-rupture-2025`; create `src/content/cases/tyrese-haliburton-achilles-rupture-2025.json`.
  - Frozen identity: Tyrese Haliburton; 2025-06-22; Indiana Pacers vs. Oklahoma City Thunder; nba-playoffs; season 2024-25.
  - Exact source pointers: video `https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals`; diagnosis `https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623`; event `https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals`.
  - Exact provenance pointers: entry `9341384e98fde6234074002d29eb97f0ca990f8899890ad4dcfecaf9f4ee0c56`; root audit `/candidates/25`; verifier results `/results/100`, `/results/101`, `/results/102`, `/results/103`.

**Per-case red → green procedure:**

1. Add the case to the coverage/content/route assertions first and observe the missing-file failure. Create only its listed path; never rename or alias a frozen candidate.
2. Copy all source identity and binding facts from the machine-readable projection and registry-resolved manifest. Do not infer a diagnosis, grade, imaging result, surgery, prognosis, rehabilitation duration, or return date from a video, title, commentary, or search snippet.
3. In the original-platform page, record the actual duration, a bounded start/end window, and ordered visible-only segments. Recheck that every timestamp is within the observed duration and that fallback behavior matches the frozen embed status. This inspection must not mutate G2 verification artifacts.
4. Separate event context, visible observation, externally documented diagnosis, and professional teaching. Select current primary research/guidelines during authorized authoring; create atomic professional claims with compatible `teaching-evidence` support. Do not copy a course unit or an individualized/phase-by-phase RTP prescription.
5. Keep `video.publicRightsReview.status: not-requested`. Finish the record with `status: medical-review` and `review.status: in-review`; set `reviewerName`, `reviewerQualification`, `reviewedAt`, and `reviewedContentDigest` exactly to `null`. The authoring agent may compute content/video digests for handoff but may not place them in an approval field or approve the record.
6. Run schema, filename, global-ID, binding, evidence-support, timecode, digest, selector, route, and review-build tests before committing this mutually exclusive set of paths.

## Task 6: Author the three injury overviews after authorization

**Files:**

- Create: `src/content/injuries/acl.json`
- Create: `src/content/injuries/ankle-sprain.json`
- Create: `src/content/injuries/achilles-rupture.json`
- Modify tests as needed: `tests/unit/injury-overview-schema.test.ts`, `tests/unit/injury-overview-digest.test.ts`, `tests/unit/routes.test.ts`

1. Write a failing exact-path/count/route test before each overview. Each file must cover all seven contract narrative fields through ordered atomic claims.
2. During authorized authoring, open current primary research and professional guidelines for anatomy/definition, commonly observed mechanisms, limitations of video, diagnostic context, treatment context, and RTP context. Record accessed/published dates and claim-level `teaching-evidence` sources; no case news/video source may substitute for medical teaching evidence.
3. Keep observational language distinct from diagnosis and explicitly state what video cannot prove. Do not copy complete RTP curricula, individualized recommendations, week-by-week progressions, phase tables, exercise dose, or clearance criteria as a prescription.
4. Set each overview to `status: medical-review` and `review.status: in-review`; set `reviewerName`, `reviewerQualification`, `reviewedAt`, and `reviewedContentDigest` exactly to `null`. Run overview schema, atomic-evidence, anti-prescription, digest, and route tests.

```bash
npx vitest run tests/unit/injury-overview-schema.test.ts tests/unit/injury-overview-digest.test.ts tests/unit/routes.test.ts
npm run content:check
```

## Task 7: Create the real 2026 Q3 baseline after cases are stable

**Files:**

- Create: `src/content/updates/2026-q3.json`
- Modify: `tests/unit/update-schema.test.ts`
- Modify: `tests/unit/update-digest.test.ts`
- Modify route/home-link assertions in `tests/unit/routes.test.ts` and relevant E2E specs

1. Before any baseline or content edit, enforce the calendar hard stop: if separately authorized execution begins after `2026-09-30`, stop and replace/rebind this plan for the then-current quarter. Otherwise add a failing baseline test for ID `2026-q3`, exact period `2026-07-01` through `2026-09-30`, and the exact 26 injury-namespaced case IDs in the machine block.
2. Populate `addedCases` only after all cases have stable computed `currentClinicalDigest` and `currentVideoSourceDigest`; sort deterministically and require a one-to-one match. Keep `updatedCases`, `retiredCases`, and `unavailableCases` empty.
3. This is a real operational baseline, not a copied fixture. Set `status: medical-review`, `review.status: in-review`, and `publishedAt: null`; set `reviewerName`, `reviewerQualification`, `reviewedAt`, and `reviewedContentDigest` exactly to `null`.
4. Test the update digest, review route, latest-update pointer, and case/video digest staleness. A later case edit must invalidate the baseline until regenerated.

## Task 8: Full G3 QA, clean content commit, and canonical review-set handoff

1. Run the plan coverage checker and all content contracts. Assert every real case/injury/league/update route by identity; check external-link-only fallback, no pre-click request, video bounds, source support compatibility, filename/slug equality, global IDs, clinical/video digests, and review UI identifiers.
2. Run the bounded suite:

```bash
npx tsx scripts/check-case-authoring-coverage.ts
npm run format:check
npm run check
npm run content:check
npm run test:coverage
npm run build:review
npm run test:e2e
npm run test:lighthouse
npm run brand:verify
npm run verify:review-artifact
```

3. Commit the complete real content and supporting tests conventionally. Confirm the commit is clean; `review-set:generate` intentionally refuses a dirty worktree or an empty/synthetic corpus.

```bash
test -z "$(git status --porcelain)"
npm run review-set:generate
npm run verify
```

4. Validate that `review/review-set.v1.json` binds all 26 case candidate/manifest/entry/decision tuples, all three overview digests, the `2026-q3` update digest, the clean content commit, content-authority snapshot, and renderer/supporting-data tree. Commit the generated review-set artifact separately and rerun the full bounded suite.
5. Prove `npm run release:public` still exits nonzero because medical approval, hosting evidence, public-rights review, publication authorization, and indexing authorization are absent. Treat that failure as required.
6. Stop. Deliver the review-set digest to the named reviewer through a separately authorized private-hosting/medical-review plan. Do not create hosting config, a remote, a push, a deployment, a public release, or indexing changes.

## Machine-readable one-to-one coverage

The checker introduced in Task 2 must read exactly the JSON between these markers. Each `manifestRecord` and `frozenProvenance` value is copied byte-semantically from the frozen manifest; planned IDs/paths are the only new mapping fields.

<!-- BEGIN NBA_CASE_AUTHORING_COVERAGE_V1 -->
```json
{
  "schemaVersion": 1,
  "coverageType": "nba-case-authoring-plan",
  "sourceBinding": {
    "task5Commit": "e26d24c6288c73df8733f0aaf9e60177c778e965",
    "manifestId": "NBA-SOURCE-2026-08-06-001",
    "manifestPath": "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json",
    "manifestDigest": "8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d",
    "sourceReviewDecisionPath": "research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json",
    "sourceReviewDecisionDigest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
    "sourcePolicyVersion": "nba-v2",
    "registryPath": "research/source-manifest-registry.v1.json",
    "registryDigest": "0e1b0279eabc5c0dccee52cf498242242acd3c38801056b4a213369bb4b3fc30",
    "previousRegistryBytesDigest": "eaf741c591ae9eb798b55a703ddadfeec7c803b91b3199272a7ccd39e56160c1",
    "caseIdConvention": {
      "acl": "CASE-NBAACL-<event year>-<candidate suffix>",
      "ankle-sprain": "CASE-NBAANKLE-<event year>-<candidate suffix>",
      "achilles-rupture": "CASE-NBAACHILLES-<event year>-<candidate suffix>"
    }
  },
  "caseCount": 26,
  "cases": [
    {
      "taskId": "case-acl-01",
      "candidateId": "CAND-NBA-ACL-2021-009",
      "caseId": "CASE-NBAACL-2021-009",
      "slug": "markelle-fultz-acl-2021",
      "path": "src/content/cases/markelle-fultz-acl-2021.json",
      "entryDigest": "db773859e92bc9fbb83c0971b3d010a1372dcf8b7ab5b8abdc333a066c24196b",
      "injuryCode": "acl",
      "frozenIdentity": {
        "athleteDisplayName": "Markelle Fultz",
        "teamAtEvent": "Orlando Magic",
        "opponent": "Cleveland Cavaliers",
        "season": "2020-21",
        "eventDate": "2021-01-06",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-acl-2021-009-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/markelle-fultz-goes-down-with-leg-injury",
            "captionCheckedAt": "2026-08-07T10:08:02Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:02Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform watch page with NBA Organization publisher attribution.",
            "provenanceCheckedAt": "2026-08-07T10:08:02Z",
            "provenanceCheckedBy": "nba-injury-case-source-discovery",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2021-01-06",
            "title": "Markelle Fultz goes down with leg injury",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2021-009-video",
            "type": "video-original",
            "title": "Markelle Fultz goes down with leg injury",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/markelle-fultz-goes-down-with-leg-injury",
            "publishedAt": "2021-01-06",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-acl-2021-009-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "orlando-magic",
              "originReportId": null,
              "publishedAt": "2021-01-06",
              "publisher": "Orlando Magic",
              "title": "Magic Sweep Mini-Series Against Cavs, But Lose Markelle Fultz to Torn ACL",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/magic/news/magic-sweep-mini-series-against-cavs-lose-markelle-fultz-torn-acl-20210106"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-acl-2021-009-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Magic Sweep Mini-Series Against Cavs, But Lose Markelle Fultz to Torn ACL",
              "publisher": "Orlando Magic",
              "independenceGroup": "orlando-magic",
              "originReportId": null,
              "url": "https://www.nba.com/magic/news/magic-sweep-mini-series-against-cavs-lose-markelle-fultz-torn-acl-20210106",
              "publishedAt": "2021-01-06",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-acl-2021-009-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2021-01-06",
            "publisher": "NBA.com",
            "title": "Markelle Fultz goes down with leg injury",
            "url": "https://www.nba.com/watch/video/markelle-fultz-goes-down-with-leg-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2021-009-event",
            "type": "event-context",
            "title": "Markelle Fultz goes down with leg injury",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/markelle-fultz-goes-down-with-leg-injury",
            "publishedAt": "2021-01-06",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-acl-2021-009-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-acl-2021-009-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Markelle Fultz, 2021-01-06, Orlando Magic vs. Cleveland Cavaliers, and nba-regular-season; the diagnosis explicitly supports “Torn ACL in left knee.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/0",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/0/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/magic/news/magic-sweep-mini-series-against-cavs-lose-markelle-fultz-torn-acl-20210106"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/0",
            "/results/1",
            "/results/2",
            "/results/3"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/0",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-acl-01-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/markelle-fultz-goes-down-with-leg-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-acl-01-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:02Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-acl-01-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:02Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-acl-01-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-acl-01-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-acl-01-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-acl-01-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-acl-01-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-acl-01-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-acl-01-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-acl-01-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-acl-02",
      "candidateId": "CAND-NBA-ACL-2021-010",
      "caseId": "CASE-NBAACL-2021-010",
      "slug": "thomas-bryant-acl-2021",
      "path": "src/content/cases/thomas-bryant-acl-2021.json",
      "entryDigest": "cd1b96124e29f9c20f5cc50305c7b4a22a1c0777435a99b9410be44ffefd68cc",
      "injuryCode": "acl",
      "frozenIdentity": {
        "athleteDisplayName": "Thomas Bryant",
        "teamAtEvent": "Washington Wizards",
        "opponent": "Miami Heat",
        "season": "2020-21",
        "eventDate": "2021-01-09",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-acl-2021-010-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/thomas-bryant-leaves-with-leg-injury",
            "captionCheckedAt": "2026-08-07T10:08:02Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:02Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform watch page with NBA Organization publisher attribution.",
            "provenanceCheckedAt": "2026-08-07T10:08:02Z",
            "provenanceCheckedBy": "nba-injury-case-source-discovery",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2021-01-09",
            "title": "Thomas Bryant leaves with leg injury",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2021-010-video",
            "type": "video-original",
            "title": "Thomas Bryant leaves with leg injury",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/thomas-bryant-leaves-with-leg-injury",
            "publishedAt": "2021-01-09",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-acl-2021-010-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "washington-wizards",
              "originReportId": null,
              "publishedAt": "2021-01-10",
              "publisher": "Washington Wizards",
              "title": "Thomas Bryant Injury Update",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/wizards/thomas-bryant-injury-update-1-10-21"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-acl-2021-010-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Thomas Bryant Injury Update",
              "publisher": "Washington Wizards",
              "independenceGroup": "washington-wizards",
              "originReportId": null,
              "url": "https://www.nba.com/wizards/thomas-bryant-injury-update-1-10-21",
              "publishedAt": "2021-01-10",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-acl-2021-010-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2021-01-09",
            "publisher": "NBA.com",
            "title": "Thomas Bryant leaves with leg injury",
            "url": "https://www.nba.com/watch/video/thomas-bryant-leaves-with-leg-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2021-010-event",
            "type": "event-context",
            "title": "Thomas Bryant leaves with leg injury",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/thomas-bryant-leaves-with-leg-injury",
            "publishedAt": "2021-01-09",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-acl-2021-010-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-acl-2021-010-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Thomas Bryant, 2021-01-09, Washington Wizards vs. Miami Heat, and nba-regular-season; the diagnosis explicitly supports “Partially torn ACL in left knee.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/1",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/1/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/wizards/thomas-bryant-injury-update-1-10-21"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/4",
            "/results/5",
            "/results/6",
            "/results/7"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/1",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-acl-02-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/thomas-bryant-leaves-with-leg-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-acl-02-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:02Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-acl-02-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:02Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-acl-02-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-acl-02-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-acl-02-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-acl-02-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-acl-02-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-acl-02-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-acl-02-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-acl-02-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-acl-03",
      "candidateId": "CAND-NBA-ACL-2021-015",
      "caseId": "CASE-NBAACL-2021-015",
      "slug": "ricky-rubio-acl-2021",
      "path": "src/content/cases/ricky-rubio-acl-2021.json",
      "entryDigest": "91575f6d096e475980f878b8268828c16a2589c0a0fb30977eff10817217d34b",
      "injuryCode": "acl",
      "frozenIdentity": {
        "athleteDisplayName": "Ricky Rubio",
        "teamAtEvent": "Cleveland Cavaliers",
        "opponent": "New Orleans Pelicans",
        "season": "2021-22",
        "eventDate": "2021-12-28",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-acl-2021-015-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/20211228rubioinjury",
            "captionCheckedAt": "2026-08-07T10:08:02Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:02Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform watch page with NBA Organization publisher attribution.",
            "provenanceCheckedAt": "2026-08-07T10:08:02Z",
            "provenanceCheckedBy": "nba-injury-case-source-discovery",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2021-12-28",
            "title": "Ricky Rubio suffers apparent knee left injury vs. Pelicans",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2021-015-video",
            "type": "video-original",
            "title": "Ricky Rubio suffers apparent knee left injury vs. Pelicans",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/20211228rubioinjury",
            "publishedAt": "2021-12-28",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-acl-2021-015-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "cleveland-cavaliers",
              "originReportId": null,
              "publishedAt": "2021-12-29",
              "publisher": "Cleveland Cavaliers",
              "title": "Ricky Rubio Status Update",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/cavaliers/releases/rubio-status-update-211229"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-acl-2021-015-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Ricky Rubio Status Update",
              "publisher": "Cleveland Cavaliers",
              "independenceGroup": "cleveland-cavaliers",
              "originReportId": null,
              "url": "https://www.nba.com/cavaliers/releases/rubio-status-update-211229",
              "publishedAt": "2021-12-29",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-acl-2021-015-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2021-12-28",
            "publisher": "NBA.com",
            "title": "Ricky Rubio suffers apparent knee left injury vs. Pelicans",
            "url": "https://www.nba.com/watch/video/20211228rubioinjury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2021-015-event",
            "type": "event-context",
            "title": "Ricky Rubio suffers apparent knee left injury vs. Pelicans",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/20211228rubioinjury",
            "publishedAt": "2021-12-28",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-acl-2021-015-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-acl-2021-015-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Ricky Rubio, 2021-12-28, Cleveland Cavaliers vs. New Orleans Pelicans, and nba-regular-season; the diagnosis explicitly supports “Torn ACL in left knee.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/2",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/2/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/cavaliers/releases/rubio-status-update-211229"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/8",
            "/results/9",
            "/results/10",
            "/results/11"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/2",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-acl-03-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/20211228rubioinjury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-acl-03-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:02Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-acl-03-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:02Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-acl-03-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-acl-03-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-acl-03-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-acl-03-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-acl-03-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-acl-03-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-acl-03-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-acl-03-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-acl-04",
      "candidateId": "CAND-NBA-ACL-2022-016",
      "caseId": "CASE-NBAACL-2022-016",
      "slug": "joe-ingles-acl-2022",
      "path": "src/content/cases/joe-ingles-acl-2022.json",
      "entryDigest": "eb6f20e796d38445426a575ca229812845e6f77b9c788c5a78714024abb15e6a",
      "injuryCode": "acl",
      "frozenIdentity": {
        "athleteDisplayName": "Joe Ingles",
        "teamAtEvent": "Utah Jazz",
        "opponent": "Minnesota Timberwolves",
        "season": "2021-22",
        "eventDate": "2022-01-30",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-acl-2022-016-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/20220130joeinglesinjury",
            "captionCheckedAt": "2026-08-07T12:06:06Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T12:06:06Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; the exact-event page was opened and no caption/subtitle control was observable.",
            "provenanceCheckedAt": "2026-08-07T12:06:06Z",
            "provenanceCheckedBy": "Codex ACL source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2022-01-30",
            "title": "Joe Ingles injures knee",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2022-016-video",
            "type": "video-original",
            "title": "Joe Ingles injures knee",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/20220130joeinglesinjury",
            "publishedAt": "2022-01-30",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-acl-2022-016-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "utah-jazz",
              "originReportId": null,
              "publishedAt": "2022-01-31",
              "publisher": "Utah Jazz",
              "title": "Joe Ingles Injury Update",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/jazz/news/joe-ingles-injury-update"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-acl-2022-016-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Joe Ingles Injury Update",
              "publisher": "Utah Jazz",
              "independenceGroup": "utah-jazz",
              "originReportId": null,
              "url": "https://www.nba.com/jazz/news/joe-ingles-injury-update",
              "publishedAt": "2022-01-31",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-acl-2022-016-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2022-01-30",
            "publisher": "NBA.com",
            "title": "Joe Ingles injures knee",
            "url": "https://www.nba.com/watch/video/20220130joeinglesinjury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2022-016-event",
            "type": "event-context",
            "title": "Joe Ingles injures knee",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/20220130joeinglesinjury",
            "publishedAt": "2022-01-30",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-acl-2022-016-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-acl-2022-016-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Joe Ingles, 2022-01-30, Utah Jazz vs. Minnesota Timberwolves, and nba-regular-season; the diagnosis explicitly supports “Torn ACL in left knee.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence. The official NBA game page https://www.nba.com/game/uta-vs-min-0022100757 was also opened and fixes Utah at Minnesota, the 2022-01-30 regular-season event, and Ingles' second-quarter knee injury.",
          "rootAuditReference": "/candidates/3",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/3/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/jazz/news/joe-ingles-injury-update"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/12",
            "/results/13",
            "/results/14",
            "/results/15"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/3",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-acl-04-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/20220130joeinglesinjury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-acl-04-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T12:06:06Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-acl-04-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T12:06:06Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-acl-04-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-acl-04-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-acl-04-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-acl-04-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-acl-04-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-acl-04-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-acl-04-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-acl-04-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-acl-05",
      "candidateId": "CAND-NBA-ACL-2022-017",
      "caseId": "CASE-NBAACL-2022-017",
      "slug": "danny-green-acl-2022",
      "path": "src/content/cases/danny-green-acl-2022.json",
      "entryDigest": "a4e3c3c13c5eeb024c757f670c6156fe9e0f12d077cb3af5f9289f7e12f5800d",
      "injuryCode": "acl",
      "frozenIdentity": {
        "athleteDisplayName": "Danny Green",
        "teamAtEvent": "Philadelphia 76ers",
        "opponent": "Miami Heat",
        "season": "2021-22",
        "eventDate": "2022-05-12",
        "competition": "nba-playoffs",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-acl-2022-017-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/danny-green-leaves-the-game-due-to-injury",
            "captionCheckedAt": "2026-08-07T10:08:02Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:02Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform watch page with NBA Organization publisher attribution.",
            "provenanceCheckedAt": "2026-08-07T10:08:02Z",
            "provenanceCheckedBy": "nba-injury-case-source-discovery",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2022-05-12",
            "title": "Sixers' Danny Green exits Game 6 with left knee injury, will not return",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2022-017-video",
            "type": "video-original",
            "title": "Sixers' Danny Green exits Game 6 with left knee injury, will not return",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/danny-green-leaves-the-game-due-to-injury",
            "publishedAt": "2022-05-12",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-acl-2022-017-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2022-05-14",
              "publisher": "NBA.com",
              "title": "76ers' Danny Green suffers torn ACL in left knee",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/76ers-guard-danny-green-exits-game-6-with-left-knee-injury"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-acl-2022-017-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "76ers' Danny Green suffers torn ACL in left knee",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/76ers-guard-danny-green-exits-game-6-with-left-knee-injury",
              "publishedAt": "2022-05-14",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-acl-2022-017-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2022-05-12",
            "publisher": "NBA.com",
            "title": "Sixers' Danny Green exits Game 6 with left knee injury, will not return",
            "url": "https://www.nba.com/watch/video/danny-green-leaves-the-game-due-to-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2022-017-event",
            "type": "event-context",
            "title": "Sixers' Danny Green exits Game 6 with left knee injury, will not return",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/danny-green-leaves-the-game-due-to-injury",
            "publishedAt": "2022-05-12",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-acl-2022-017-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-acl-2022-017-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Danny Green, 2022-05-12, Philadelphia 76ers vs. Miami Heat, and nba-playoffs; the diagnosis explicitly supports “Torn ACL in left knee.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/4",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/4/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/76ers-guard-danny-green-exits-game-6-with-left-knee-injury"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/16",
            "/results/17",
            "/results/18",
            "/results/19"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/4",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-acl-05-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/danny-green-leaves-the-game-due-to-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-acl-05-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:02Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-acl-05-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:02Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-acl-05-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-acl-05-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-acl-05-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-acl-05-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-acl-05-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-acl-05-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-acl-05-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-acl-05-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-acl-06",
      "candidateId": "CAND-NBA-ACL-2024-023",
      "caseId": "CASE-NBAACL-2024-023",
      "slug": "moritz-wagner-acl-2024",
      "path": "src/content/cases/moritz-wagner-acl-2024.json",
      "entryDigest": "ff8f7d6da7b63c2e470ac04a4405fe2ab5ffc30e47154147e7a305ff46d2a39e",
      "injuryCode": "acl",
      "frozenIdentity": {
        "athleteDisplayName": "Moritz Wagner",
        "teamAtEvent": "Orlando Magic",
        "opponent": "Miami Heat",
        "season": "2024-25",
        "eventDate": "2024-12-21",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-acl-2024-023-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/moritz-wagner-left-knee-injury-heat-magic-dec-21",
            "captionCheckedAt": "2026-08-07T12:06:06Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T12:06:06Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; the exact-event page was opened and no caption/subtitle control was observable.",
            "provenanceCheckedAt": "2026-08-07T12:06:06Z",
            "provenanceCheckedBy": "Codex ACL source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2024-12-21",
            "title": "Moritz Wagner suffers left knee injury, exits early vs. Heat",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2024-023-video",
            "type": "video-original",
            "title": "Moritz Wagner suffers left knee injury, exits early vs. Heat",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/moritz-wagner-left-knee-injury-heat-magic-dec-21",
            "publishedAt": "2024-12-21",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-acl-2024-023-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "orlando-magic",
              "originReportId": null,
              "publishedAt": "2024-12-22",
              "publisher": "Orlando Magic",
              "title": "Orlando Magic Center Moe Wagner Suffers Torn ACL",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/magic/news/orlando-magic-center-moe-wagner-suffers-torn-acl-injury-update-20241222"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-acl-2024-023-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Orlando Magic Center Moe Wagner Suffers Torn ACL",
              "publisher": "Orlando Magic",
              "independenceGroup": "orlando-magic",
              "originReportId": null,
              "url": "https://www.nba.com/magic/news/orlando-magic-center-moe-wagner-suffers-torn-acl-injury-update-20241222",
              "publishedAt": "2024-12-22",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-acl-2024-023-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2024-12-21",
            "publisher": "NBA.com",
            "title": "Moritz Wagner suffers left knee injury, exits early vs. Heat",
            "url": "https://www.nba.com/watch/video/moritz-wagner-left-knee-injury-heat-magic-dec-21"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2024-023-event",
            "type": "event-context",
            "title": "Moritz Wagner suffers left knee injury, exits early vs. Heat",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/moritz-wagner-left-knee-injury-heat-magic-dec-21",
            "publishedAt": "2024-12-21",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-acl-2024-023-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-acl-2024-023-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Moritz Wagner, 2024-12-21, Orlando Magic vs. Miami Heat, and nba-regular-season; the diagnosis explicitly supports “Torn ACL in left knee.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/5",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/5/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/magic/news/orlando-magic-center-moe-wagner-suffers-torn-acl-injury-update-20241222"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/20",
            "/results/21",
            "/results/22",
            "/results/23"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/5",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-acl-06-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/moritz-wagner-left-knee-injury-heat-magic-dec-21",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-acl-06-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T12:06:06Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-acl-06-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T12:06:06Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-acl-06-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-acl-06-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-acl-06-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-acl-06-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-acl-06-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-acl-06-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-acl-06-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-acl-06-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-acl-07",
      "candidateId": "CAND-NBA-ACL-2025-021",
      "caseId": "CASE-NBAACL-2025-021",
      "slug": "kyrie-irving-acl-2025",
      "path": "src/content/cases/kyrie-irving-acl-2025.json",
      "entryDigest": "149c643c561b5fe8b03bdf76a5f322c42fd5947b58799ecdafdfaef8cfe7b51e",
      "injuryCode": "acl",
      "frozenIdentity": {
        "athleteDisplayName": "Kyrie Irving",
        "teamAtEvent": "Dallas Mavericks",
        "opponent": "Sacramento Kings",
        "season": "2024-25",
        "eventDate": "2025-03-03",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-acl-2025-021-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/kyrie-irving-left-knee-sprain-injury-kings-mavericks-march-3",
            "captionCheckedAt": "2026-08-07T12:06:06Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T12:06:06Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; the exact-event page was opened and no caption/subtitle control was observable.",
            "provenanceCheckedAt": "2026-08-07T12:06:06Z",
            "provenanceCheckedBy": "Codex ACL source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2025-03-03",
            "title": "Kyrie Irving suffers left knee sprain injury, exits early vs. Kings",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2025-021-video",
            "type": "video-original",
            "title": "Kyrie Irving suffers left knee sprain injury, exits early vs. Kings",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/kyrie-irving-left-knee-sprain-injury-kings-mavericks-march-3",
            "publishedAt": "2025-03-03",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-acl-2025-021-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2025-03-05",
              "publisher": "NBA.com",
              "title": "Kyrie Irving (torn ACL) out for rest of season",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/kyrie-irving-knee-injury-mavericks-kings"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-acl-2025-021-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Kyrie Irving (torn ACL) out for rest of season",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/kyrie-irving-knee-injury-mavericks-kings",
              "publishedAt": "2025-03-05",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-acl-2025-021-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2025-03-03",
            "publisher": "NBA.com",
            "title": "Kyrie Irving suffers left knee sprain injury, exits early vs. Kings",
            "url": "https://www.nba.com/watch/video/kyrie-irving-left-knee-sprain-injury-kings-mavericks-march-3"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-acl-2025-021-event",
            "type": "event-context",
            "title": "Kyrie Irving suffers left knee sprain injury, exits early vs. Kings",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/kyrie-irving-left-knee-sprain-injury-kings-mavericks-march-3",
            "publishedAt": "2025-03-03",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-acl-2025-021-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-acl-2025-021-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Kyrie Irving, 2025-03-03, Dallas Mavericks vs. Sacramento Kings, and nba-regular-season; the diagnosis explicitly supports “Torn ACL in left knee.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/6",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/6/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/kyrie-irving-knee-injury-mavericks-kings"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/24",
            "/results/25",
            "/results/26",
            "/results/27"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/6",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-acl-07-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/kyrie-irving-left-knee-sprain-injury-kings-mavericks-march-3",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-acl-07-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T12:06:06Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-acl-07-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T12:06:06Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-acl-07-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-acl-07-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-acl-07-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-acl-07-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-acl-07-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-acl-07-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-acl-07-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-acl-07-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-01",
      "candidateId": "CAND-NBA-ANKLE-2020-002",
      "caseId": "CASE-NBAANKLE-2020-002",
      "slug": "cj-mccollum-ankle-sprain-2020",
      "path": "src/content/cases/cj-mccollum-ankle-sprain-2020.json",
      "entryDigest": "29f20a3b517cce71bfba4599a1b0833abe6ab3096c4cd7409e3af90dd8dbad49",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "CJ McCollum",
        "teamAtEvent": "Portland Trail Blazers",
        "opponent": "Dallas Mavericks",
        "season": "2019-20",
        "eventDate": "2020-01-17",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2020-002-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury",
            "captionCheckedAt": "2026-08-07T10:08:25Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:25Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA-hosted original Watch page on the league official platform; NBA Watch channel page opened and matched.",
            "provenanceCheckedAt": "2026-08-07T10:08:25Z",
            "provenanceCheckedBy": "Codex ankle-sprain researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2020-01-17",
            "title": "CJ McCollum exits after an ankle injury",
            "uploaderName": "NBA",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2020-002-video",
            "type": "video-original",
            "title": "CJ McCollum exits after an ankle injury",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury",
            "publishedAt": "2020-01-17",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2020-002-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2020-01-18",
              "publisher": "NBA.com",
              "title": "CJ McCollum (left ankle sprain) exits early vs. Mavericks",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/cj-mccollum-exits-left-ankle-sprain"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2020-002-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "CJ McCollum (left ankle sprain) exits early vs. Mavericks",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/cj-mccollum-exits-left-ankle-sprain",
              "publishedAt": "2020-01-18",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2020-002-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2020-01-17",
            "publisher": "NBA",
            "title": "CJ McCollum exits after an ankle injury",
            "url": "https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2020-002-event",
            "type": "event-context",
            "title": "CJ McCollum exits after an ankle injury",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury",
            "publishedAt": "2020-01-17",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2020-002-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2020-002-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched CJ McCollum, 2020-01-17, Portland Trail Blazers vs. Dallas Mavericks, and nba-regular-season; the diagnosis explicitly supports “Portland announced a left ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/7",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/7/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/cj-mccollum-exits-left-ankle-sprain"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/28",
            "/results/29",
            "/results/30",
            "/results/31"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/7",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-01-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-01-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-01-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-01-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-01-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-01-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-01-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-01-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-01-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-01-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-01-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-02",
      "candidateId": "CAND-NBA-ANKLE-2020-001",
      "caseId": "CASE-NBAANKLE-2020-001",
      "slug": "ja-morant-ankle-sprain-2020",
      "path": "src/content/cases/ja-morant-ankle-sprain-2020.json",
      "entryDigest": "dfdc6d3f7bc1701072fe4bde1c479bb1cfe20d437166f250b72be8e2418f6889",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "Ja Morant",
        "teamAtEvent": "Memphis Grizzlies",
        "opponent": "Brooklyn Nets",
        "season": "2020-21",
        "eventDate": "2020-12-28",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2020-001-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair",
            "captionCheckedAt": "2026-08-07T10:08:25Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:25Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA-hosted original Watch page on the league official platform; NBA Watch channel page opened and matched.",
            "provenanceCheckedAt": "2026-08-07T10:08:25Z",
            "provenanceCheckedBy": "Codex ankle-sprain researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2020-12-28",
            "title": "Ja Morant suffers left ankle sprain, exits in wheelchair",
            "uploaderName": "NBA",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2020-001-video",
            "type": "video-original",
            "title": "Ja Morant suffers left ankle sprain, exits in wheelchair",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair",
            "publishedAt": "2020-12-28",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2020-001-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2020-12-30",
              "publisher": "NBA.com",
              "title": "Ja Morant out 3-5 weeks with Grade 2 ankle sprain",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/ja-morant-out-3-5-weeks-with-grade-2-ankle-sprain"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2020-001-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Ja Morant out 3-5 weeks with Grade 2 ankle sprain",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/ja-morant-out-3-5-weeks-with-grade-2-ankle-sprain",
              "publishedAt": "2020-12-30",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2020-001-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2020-12-28",
            "publisher": "NBA",
            "title": "Ja Morant suffers left ankle sprain, exits in wheelchair",
            "url": "https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2020-001-event",
            "type": "event-context",
            "title": "Ja Morant suffers left ankle sprain, exits in wheelchair",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair",
            "publishedAt": "2020-12-28",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2020-001-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2020-001-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Ja Morant, 2020-12-28, Memphis Grizzlies vs. Brooklyn Nets, and nba-regular-season; the diagnosis explicitly supports “Memphis reported a left ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/8",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/8/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/ja-morant-out-3-5-weeks-with-grade-2-ankle-sprain"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/32",
            "/results/33",
            "/results/34",
            "/results/35"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/8",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-02-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-02-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-02-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-02-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-02-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-02-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-02-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-02-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-02-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-02-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-02-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-03",
      "candidateId": "CAND-NBA-ANKLE-2021-003",
      "caseId": "CASE-NBAANKLE-2021-003",
      "slug": "lebron-james-ankle-sprain-2021",
      "path": "src/content/cases/lebron-james-ankle-sprain-2021.json",
      "entryDigest": "c9d1c68f9edcbdba4c677b5dc1f994779a9d35d756c492ac5a9f823d9b169f6e",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "LeBron James",
        "teamAtEvent": "Los Angeles Lakers",
        "opponent": "Atlanta Hawks",
        "season": "2020-21",
        "eventDate": "2021-03-20",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2021-003-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return",
            "captionCheckedAt": "2026-08-07T11:46:19Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:46:19Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com league article published on the event date with an embedded NBA player showing the exact in-game injury event; the original platform page and embedded player were opened, and no caption/subtitle control was observable.",
            "provenanceCheckedAt": "2026-08-07T11:46:19Z",
            "provenanceCheckedBy": "Codex ankle-sprain source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2021-03-20",
            "title": "LeBron James out indefinitely with high ankle sprain",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2021-003-video",
            "type": "video-original",
            "title": "LeBron James out indefinitely with high ankle sprain",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return",
            "publishedAt": "2021-03-20",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2021-003-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2021-03-20",
              "publisher": "NBA.com",
              "title": "LeBron James out indefinitely with high ankle sprain",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2021-003-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "LeBron James out indefinitely with high ankle sprain",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return",
              "publishedAt": "2021-03-20",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2021-003-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2021-03-20",
            "publisher": "NBA.com",
            "title": "LeBron James out indefinitely with high ankle sprain",
            "url": "https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2021-003-event",
            "type": "event-context",
            "title": "LeBron James out indefinitely with high ankle sprain",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return",
            "publishedAt": "2021-03-20",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2021-003-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2021-003-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched LeBron James, 2021-03-20, Los Angeles Lakers vs. Atlanta Hawks, and nba-regular-season; the diagnosis explicitly supports “High right ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. Event/video and diagnosis are co-located on one NBA.com article; no independent second diagnosis is claimed or required for this recent first-party case.",
          "rootAuditReference": "/candidates/9",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/9/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/36",
            "/results/37",
            "/results/38",
            "/results/39"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/9",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-03-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-03-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-03-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-03-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-03-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-03-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-03-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-03-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-03-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-03-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-03-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-04",
      "candidateId": "CAND-NBA-ANKLE-2021-001",
      "caseId": "CASE-NBAANKLE-2021-001",
      "slug": "trae-young-ankle-sprain-2021",
      "path": "src/content/cases/trae-young-ankle-sprain-2021.json",
      "entryDigest": "cb2b83513cd89aa618916ac61700b97163b7b39fb0943f18e2d41dd6a16eed58",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "Trae Young",
        "teamAtEvent": "Atlanta Hawks",
        "opponent": "New York Knicks",
        "season": "2020-21",
        "eventDate": "2021-04-21",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2021-001-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/traeinjuryvsknicks",
            "captionCheckedAt": "2026-08-07T10:08:25Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:25Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA-hosted original Watch page on the league official platform; NBA Watch channel page opened and matched.",
            "provenanceCheckedAt": "2026-08-07T10:08:25Z",
            "provenanceCheckedBy": "Codex ankle-sprain researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2021-04-21",
            "title": "Trae Young goes down with ankle injury, helped off court",
            "uploaderName": "NBA",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2021-001-video",
            "type": "video-original",
            "title": "Trae Young goes down with ankle injury, helped off court",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/traeinjuryvsknicks",
            "publishedAt": "2021-04-21",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2021-001-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2021-04-23",
              "publisher": "NBA.com",
              "title": "Hawks' Trae Young diagnosed with a lateral left ankle sprain",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/report-trae-youngs-ankle-injury-not-considered-serious"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2021-001-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Hawks' Trae Young diagnosed with a lateral left ankle sprain",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/report-trae-youngs-ankle-injury-not-considered-serious",
              "publishedAt": "2021-04-23",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2021-001-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2021-04-21",
            "publisher": "NBA",
            "title": "Trae Young goes down with ankle injury, helped off court",
            "url": "https://www.nba.com/watch/video/traeinjuryvsknicks"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2021-001-event",
            "type": "event-context",
            "title": "Trae Young goes down with ankle injury, helped off court",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/traeinjuryvsknicks",
            "publishedAt": "2021-04-21",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2021-001-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2021-001-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Trae Young, 2021-04-21, Atlanta Hawks vs. New York Knicks, and nba-regular-season; the diagnosis explicitly supports “Atlanta announced a left ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/10",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/10/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/report-trae-youngs-ankle-injury-not-considered-serious"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/40",
            "/results/41",
            "/results/42",
            "/results/43"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/10",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-04-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/traeinjuryvsknicks",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-04-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-04-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-04-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-04-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-04-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-04-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-04-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-04-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-04-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-04-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-05",
      "candidateId": "CAND-NBA-ANKLE-2021-002",
      "caseId": "CASE-NBAANKLE-2021-002",
      "slug": "kyrie-irving-ankle-sprain-2021",
      "path": "src/content/cases/kyrie-irving-ankle-sprain-2021.json",
      "entryDigest": "0a89a3fef7d984f32fe7b8ef22b983b305f9c74a6f5bb6f83c1963e4fe115e11",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "Kyrie Irving",
        "teamAtEvent": "Brooklyn Nets",
        "opponent": "Milwaukee Bucks",
        "season": "2020-21",
        "eventDate": "2021-06-13",
        "competition": "nba-playoffs",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2021-002-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain",
            "captionCheckedAt": "2026-08-07T11:46:19Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:46:19Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com league article published on the event date with an embedded NBA player showing the exact in-game injury event; the original platform page and embedded player were opened, and no caption/subtitle control was observable.",
            "provenanceCheckedAt": "2026-08-07T11:46:19Z",
            "provenanceCheckedBy": "Codex ankle-sprain source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2021-06-13",
            "title": "Kyrie Irving exits Game 4 with right ankle sprain",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2021-002-video",
            "type": "video-original",
            "title": "Kyrie Irving exits Game 4 with right ankle sprain",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain",
            "publishedAt": "2021-06-13",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2021-002-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2021-06-13",
              "publisher": "NBA.com",
              "title": "Kyrie Irving exits Game 4 with right ankle sprain",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2021-002-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Kyrie Irving exits Game 4 with right ankle sprain",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain",
              "publishedAt": "2021-06-13",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2021-002-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2021-06-13",
            "publisher": "NBA.com",
            "title": "Kyrie Irving exits Game 4 with right ankle sprain",
            "url": "https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2021-002-event",
            "type": "event-context",
            "title": "Kyrie Irving exits Game 4 with right ankle sprain",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain",
            "publishedAt": "2021-06-13",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2021-002-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2021-002-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Kyrie Irving, 2021-06-13, Brooklyn Nets vs. Milwaukee Bucks, and nba-playoffs; the diagnosis explicitly supports “Right ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. Event/video and diagnosis are co-located on one NBA.com article; no independent second diagnosis is claimed or required for this recent first-party case.",
          "rootAuditReference": "/candidates/11",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/11/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/44",
            "/results/45",
            "/results/46",
            "/results/47"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/11",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-05-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-05-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-05-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-05-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-05-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-05-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-05-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-05-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-05-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-05-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-05-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-06",
      "candidateId": "CAND-NBA-ANKLE-2022-001",
      "caseId": "CASE-NBAANKLE-2022-001",
      "slug": "lamelo-ball-ankle-sprain-2022",
      "path": "src/content/cases/lamelo-ball-ankle-sprain-2022.json",
      "entryDigest": "fa712ba7e930b082b6648645e6fcce7773874407d2371a42f2d4251103f17316",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "LaMelo Ball",
        "teamAtEvent": "Charlotte Hornets",
        "opponent": "Indiana Pacers",
        "season": "2022-23",
        "eventDate": "2022-11-16",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2022-001-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury",
            "captionCheckedAt": "2026-08-07T10:08:25Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:25Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA-hosted original Watch page on the league official platform; NBA Watch channel page opened and matched.",
            "provenanceCheckedAt": "2026-08-07T10:08:25Z",
            "provenanceCheckedBy": "Codex ankle-sprain researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2022-11-16",
            "title": "LaMelo Ball leaves game with left ankle injury",
            "uploaderName": "NBA",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2022-001-video",
            "type": "video-original",
            "title": "LaMelo Ball leaves game with left ankle injury",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury",
            "publishedAt": "2022-11-16",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2022-001-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2022-11-17",
              "publisher": "NBA.com",
              "title": "Hornets’ LaMelo Ball re-injures ankle after stepping on fan’s foot",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/lamelo-ball-reinjures-ankle-after-stepping-on-fans-foot"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2022-001-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Hornets’ LaMelo Ball re-injures ankle after stepping on fan’s foot",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/lamelo-ball-reinjures-ankle-after-stepping-on-fans-foot",
              "publishedAt": "2022-11-17",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2022-001-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2022-11-16",
            "publisher": "NBA",
            "title": "LaMelo Ball leaves game with left ankle injury",
            "url": "https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2022-001-event",
            "type": "event-context",
            "title": "LaMelo Ball leaves game with left ankle injury",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury",
            "publishedAt": "2022-11-16",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2022-001-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2022-001-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched LaMelo Ball, 2022-11-16, Charlotte Hornets vs. Indiana Pacers, and nba-regular-season; the diagnosis explicitly supports “Charlotte reported a left ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/12",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/12/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/lamelo-ball-reinjures-ankle-after-stepping-on-fans-foot"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/48",
            "/results/49",
            "/results/50",
            "/results/51"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/12",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-06-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-06-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-06-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-06-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-06-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-06-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-06-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-06-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-06-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-06-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-06-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-07",
      "candidateId": "CAND-NBA-ANKLE-2023-004",
      "caseId": "CASE-NBAANKLE-2023-004",
      "slug": "anfernee-simons-ankle-sprain-2023",
      "path": "src/content/cases/anfernee-simons-ankle-sprain-2023.json",
      "entryDigest": "41c20c51b043257c9a516c7197e000343e26328dea5a161f0083da3b21b3c0c9",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "Anfernee Simons",
        "teamAtEvent": "Portland Trail Blazers",
        "opponent": "Washington Wizards",
        "season": "2022-23",
        "eventDate": "2023-02-14",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2023-004-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/anfernee-simons-leaves-the-game-due-to-injury",
            "captionCheckedAt": "2026-08-07T11:46:19Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:46:19Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; the exact-event page was opened and no caption/subtitle control was observable.",
            "provenanceCheckedAt": "2026-08-07T11:46:19Z",
            "provenanceCheckedBy": "Codex ankle-sprain source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2023-02-14",
            "title": "Trail Blazers' Anfernee Simons leaves game with injury",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2023-004-video",
            "type": "video-original",
            "title": "Trail Blazers' Anfernee Simons leaves game with injury",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/anfernee-simons-leaves-the-game-due-to-injury",
            "publishedAt": "2023-02-14",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2023-004-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2023-02-17",
              "publisher": "NBA.com",
              "title": "Trail Blazers' Anfernee Simons sidelined with grade 2 ankle sprain",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/blazers-anfernee-simons-injury-update"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2023-004-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Trail Blazers' Anfernee Simons sidelined with grade 2 ankle sprain",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/blazers-anfernee-simons-injury-update",
              "publishedAt": "2023-02-17",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2023-004-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2023-02-14",
            "publisher": "NBA.com",
            "title": "Trail Blazers' Anfernee Simons leaves game with injury",
            "url": "https://www.nba.com/watch/video/anfernee-simons-leaves-the-game-due-to-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2023-004-event",
            "type": "event-context",
            "title": "Trail Blazers' Anfernee Simons leaves game with injury",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/anfernee-simons-leaves-the-game-due-to-injury",
            "publishedAt": "2023-02-14",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2023-004-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2023-004-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Anfernee Simons, 2023-02-14, Portland Trail Blazers vs. Washington Wizards, and nba-regular-season; the diagnosis explicitly supports “Grade 2 right ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/13",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/13/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/blazers-anfernee-simons-injury-update"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/52",
            "/results/53",
            "/results/54",
            "/results/55"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/13",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-07-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/anfernee-simons-leaves-the-game-due-to-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-07-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-07-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-07-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-07-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-07-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-07-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-07-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-07-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-07-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-07-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-08",
      "candidateId": "CAND-NBA-ANKLE-2023-001",
      "caseId": "CASE-NBAANKLE-2023-001",
      "slug": "anthony-edwards-ankle-sprain-2023",
      "path": "src/content/cases/anthony-edwards-ankle-sprain-2023.json",
      "entryDigest": "1143ef138f4838fd6ec7607b504d54bbfbd661a69a2995568b1b465a71cfbcc7",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "Anthony Edwards",
        "teamAtEvent": "Minnesota Timberwolves",
        "opponent": "Chicago Bulls",
        "season": "2022-23",
        "eventDate": "2023-03-17",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2023-001-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.youtube.com/watch?v=V9mtX4mE8wQ",
            "captionCheckedAt": "2026-08-07T10:08:25Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.youtube.com/@espn",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:25Z",
            "embedStatus": "verified",
            "provenanceBasis": "ESPN original verified YouTube channel and broadcaster/rightsholder upload; privacy-enhanced player opened paused with autoplay disabled.",
            "provenanceCheckedAt": "2026-08-07T10:08:25Z",
            "provenanceCheckedBy": "Codex ankle-sprain researcher",
            "provenanceStatus": "verified",
            "provider": "youtube",
            "publishedAt": "2023-03-17",
            "title": "Anthony Edwards helped off court after apparent ankle injury | NBA on ESPN",
            "uploaderName": "ESPN",
            "uploaderProvenance": "broadcaster-rightsholder"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2023-001-video",
            "type": "video-original",
            "title": "Anthony Edwards helped off court after apparent ankle injury | NBA on ESPN",
            "publisher": "ESPN",
            "independenceGroup": "espn",
            "originReportId": null,
            "url": "https://www.youtube.com/watch?v=V9mtX4mE8wQ",
            "publishedAt": "2023-03-17",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2023-001-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2023-03-18",
              "publisher": "NBA.com",
              "title": "Anthony Edwards sprains right ankle, exits early vs. Bulls",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/anthony-edwards-sprains-right-ankle-exits-early-vs-bulls"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2023-001-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Anthony Edwards sprains right ankle, exits early vs. Bulls",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/anthony-edwards-sprains-right-ankle-exits-early-vs-bulls",
              "publishedAt": "2023-03-18",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2023-001-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2023-03-17",
            "publisher": "ESPN",
            "title": "Anthony Edwards helped off court after apparent ankle injury | NBA on ESPN",
            "url": "https://www.youtube.com/watch?v=V9mtX4mE8wQ"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2023-001-event",
            "type": "event-context",
            "title": "Anthony Edwards helped off court after apparent ankle injury | NBA on ESPN",
            "publisher": "ESPN",
            "independenceGroup": "espn",
            "originReportId": null,
            "url": "https://www.youtube.com/watch?v=V9mtX4mE8wQ",
            "publishedAt": "2023-03-17",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2023-001-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2023-001-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Anthony Edwards, 2023-03-17, Minnesota Timberwolves vs. Chicago Bulls, and nba-regular-season; the diagnosis explicitly supports “NBA.com reported a right ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence. The verified ESPN channel and privacy-enhanced player were reopened; the latter returned player configuration error 153, consistent with external-link-only handling.",
          "rootAuditReference": "/candidates/14",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/14/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/anthony-edwards-sprains-right-ankle-exits-early-vs-bulls"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/56",
            "/results/57",
            "/results/58",
            "/results/59"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/14",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-08-timecode-verification",
        "canonicalVideoUrl": "https://www.youtube.com/watch?v=V9mtX4mE8wQ",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-08-embed-current-check",
          "frozenStatus": "verified",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-08-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-08-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-08-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-08-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-08-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-08-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-08-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-08-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-08-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-09",
      "candidateId": "CAND-NBA-ANKLE-2023-008",
      "caseId": "CASE-NBAANKLE-2023-008",
      "slug": "lamelo-ball-ankle-sprain-2023",
      "path": "src/content/cases/lamelo-ball-ankle-sprain-2023.json",
      "entryDigest": "cd2cfe1c8e310969f80f2b5379eb34345f113a9e8e43c1cb00f4f09f52481276",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "LaMelo Ball",
        "teamAtEvent": "Charlotte Hornets",
        "opponent": "Orlando Magic",
        "season": "2023-24",
        "eventDate": "2023-11-26",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2023-008-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/lamelo-ball-leaves-the-game-with-a-right-leg-injury",
            "captionCheckedAt": "2026-08-07T11:46:19Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:46:19Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; the exact-event page was opened and no caption/subtitle control was observable.",
            "provenanceCheckedAt": "2026-08-07T11:46:19Z",
            "provenanceCheckedBy": "Codex ankle-sprain source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2023-11-26",
            "title": "LaMelo Ball leaves the game with a right ankle injury",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2023-008-video",
            "type": "video-original",
            "title": "LaMelo Ball leaves the game with a right ankle injury",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/lamelo-ball-leaves-the-game-with-a-right-leg-injury",
            "publishedAt": "2023-11-26",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2023-008-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2023-11-27",
              "publisher": "NBA.com",
              "title": "Hornets' LaMelo Ball carried off with ankle strain, misses rest of game vs. Magic",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/hornets-lamelo-ball-out-right-ankle-strain"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2023-008-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Hornets' LaMelo Ball carried off with ankle strain, misses rest of game vs. Magic",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/hornets-lamelo-ball-out-right-ankle-strain",
              "publishedAt": "2023-11-27",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2023-008-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2023-11-26",
            "publisher": "NBA.com",
            "title": "LaMelo Ball leaves the game with a right ankle injury",
            "url": "https://www.nba.com/watch/video/lamelo-ball-leaves-the-game-with-a-right-leg-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2023-008-event",
            "type": "event-context",
            "title": "LaMelo Ball leaves the game with a right ankle injury",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/lamelo-ball-leaves-the-game-with-a-right-leg-injury",
            "publishedAt": "2023-11-26",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2023-008-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2023-008-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched LaMelo Ball, 2023-11-26, Charlotte Hornets vs. Orlando Magic, and nba-regular-season; the diagnosis explicitly supports “Right ankle strain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/15",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/15/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/hornets-lamelo-ball-out-right-ankle-strain"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/60",
            "/results/61",
            "/results/62",
            "/results/63"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/15",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-09-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/lamelo-ball-leaves-the-game-with-a-right-leg-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-09-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-09-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-09-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-09-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-09-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-09-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-09-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-09-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-09-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-09-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-10",
      "candidateId": "CAND-NBA-ANKLE-2024-001",
      "caseId": "CASE-NBAANKLE-2024-001",
      "slug": "kevin-durant-ankle-sprain-2024",
      "path": "src/content/cases/kevin-durant-ankle-sprain-2024.json",
      "entryDigest": "df8534f96c72b7fd367c950ca93b7c39ffa9bbd22a7f911bfce651d9a6360db3",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "Kevin Durant",
        "teamAtEvent": "Phoenix Suns",
        "opponent": "San Antonio Spurs",
        "season": "2024-25",
        "eventDate": "2024-12-03",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2024-001-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/kevin-durant-left-ankle-sprain-injury-suns-spurs-dec-3",
            "captionCheckedAt": "2026-08-07T11:46:19Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:46:19Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; the exact-event page was opened and no caption/subtitle control was observable.",
            "provenanceCheckedAt": "2026-08-07T11:46:19Z",
            "provenanceCheckedBy": "Codex ankle-sprain source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2024-12-03",
            "title": "Suns forward Kevin Durant suffers left ankle sprain injury vs. Spurs",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2024-001-video",
            "type": "video-original",
            "title": "Suns forward Kevin Durant suffers left ankle sprain injury vs. Spurs",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/kevin-durant-left-ankle-sprain-injury-suns-spurs-dec-3",
            "publishedAt": "2024-12-03",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2024-001-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "phoenix-suns",
              "originReportId": null,
              "publishedAt": "2024-12-05",
              "publisher": "Phoenix Suns",
              "title": "12/05/2024 Suns vs Pelicans Game Preview",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/suns/news/12-05-2024-suns-vs-pelicans-game-preview"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2024-001-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "12/05/2024 Suns vs Pelicans Game Preview",
              "publisher": "Phoenix Suns",
              "independenceGroup": "phoenix-suns",
              "originReportId": null,
              "url": "https://www.nba.com/suns/news/12-05-2024-suns-vs-pelicans-game-preview",
              "publishedAt": "2024-12-05",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2024-001-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2024-12-03",
            "publisher": "NBA.com",
            "title": "Suns forward Kevin Durant suffers left ankle sprain injury vs. Spurs",
            "url": "https://www.nba.com/watch/video/kevin-durant-left-ankle-sprain-injury-suns-spurs-dec-3"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2024-001-event",
            "type": "event-context",
            "title": "Suns forward Kevin Durant suffers left ankle sprain injury vs. Spurs",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/kevin-durant-left-ankle-sprain-injury-suns-spurs-dec-3",
            "publishedAt": "2024-12-03",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2024-001-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2024-001-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Kevin Durant, 2024-12-03, Phoenix Suns vs. San Antonio Spurs, and nba-regular-season; the diagnosis explicitly supports “Left ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/16",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/16/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/suns/news/12-05-2024-suns-vs-pelicans-game-preview"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/64",
            "/results/65",
            "/results/66",
            "/results/67"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/16",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-10-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/kevin-durant-left-ankle-sprain-injury-suns-spurs-dec-3",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-10-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-10-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:46:19Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-10-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-10-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-10-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-10-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-10-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-10-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-10-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-10-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-11",
      "candidateId": "CAND-NBA-ANKLE-2025-002",
      "caseId": "CASE-NBAANKLE-2025-002",
      "slug": "lamelo-ball-ankle-sprain-2025",
      "path": "src/content/cases/lamelo-ball-ankle-sprain-2025.json",
      "entryDigest": "5318b193e5a43baa31fc29c82c47d6ff392cc9e07c0badfde951e577b51f22a8",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "LaMelo Ball",
        "teamAtEvent": "Charlotte Hornets",
        "opponent": "Los Angeles Lakers",
        "season": "2024-25",
        "eventDate": "2025-01-27",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2025-002-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27",
            "captionCheckedAt": "2026-08-07T10:08:25Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:25Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA-hosted original Watch page on the league official platform; NBA Watch channel page opened and matched.",
            "provenanceCheckedAt": "2026-08-07T10:08:25Z",
            "provenanceCheckedBy": "Codex ankle-sprain researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2025-01-27",
            "title": "LaMelo Ball suffers left ankle sprain injury, exits early vs. Lakers",
            "uploaderName": "NBA",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2025-002-video",
            "type": "video-original",
            "title": "LaMelo Ball suffers left ankle sprain injury, exits early vs. Lakers",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27",
            "publishedAt": "2025-01-27",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2025-002-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2025-01-30",
              "publisher": "NBA.com",
              "title": "Hornets star LaMelo Ball out at least 1 week with left ankle sprain",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/hornets-lamelo-ball-injury-update"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2025-002-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Hornets star LaMelo Ball out at least 1 week with left ankle sprain",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/hornets-lamelo-ball-injury-update",
              "publishedAt": "2025-01-30",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2025-002-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2025-01-27",
            "publisher": "NBA",
            "title": "LaMelo Ball suffers left ankle sprain injury, exits early vs. Lakers",
            "url": "https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2025-002-event",
            "type": "event-context",
            "title": "LaMelo Ball suffers left ankle sprain injury, exits early vs. Lakers",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27",
            "publishedAt": "2025-01-27",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2025-002-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2025-002-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched LaMelo Ball, 2025-01-27, Charlotte Hornets vs. Los Angeles Lakers, and nba-regular-season; the diagnosis explicitly supports “Charlotte reported a left ankle sprain.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/17",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/17/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/hornets-lamelo-ball-injury-update"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/68",
            "/results/69",
            "/results/70",
            "/results/71"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/17",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-11-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-11-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-11-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-11-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-11-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-11-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-11-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-11-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-11-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-11-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-11-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-ankle-12",
      "candidateId": "CAND-NBA-ANKLE-2025-001",
      "caseId": "CASE-NBAANKLE-2025-001",
      "slug": "anthony-edwards-ankle-sprain-2025",
      "path": "src/content/cases/anthony-edwards-ankle-sprain-2025.json",
      "entryDigest": "e839dfeca91387dfa59d7b6add14f1ac2c9aa14df1ffae1d6010616edf2833e8",
      "injuryCode": "ankle-sprain",
      "frozenIdentity": {
        "athleteDisplayName": "Anthony Edwards",
        "teamAtEvent": "Minnesota Timberwolves",
        "opponent": "Brooklyn Nets",
        "season": "2024-25",
        "eventDate": "2025-04-03",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-ankle-2025-001-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room",
            "captionCheckedAt": "2026-08-07T10:08:25Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T10:08:25Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA-hosted original Watch page on the league official platform; NBA Watch channel page opened and matched.",
            "provenanceCheckedAt": "2026-08-07T10:08:25Z",
            "provenanceCheckedBy": "Codex ankle-sprain researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2025-04-03",
            "title": "Anthony Edwards lands awkwardly and heads to the locker room",
            "uploaderName": "NBA",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2025-001-video",
            "type": "video-original",
            "title": "Anthony Edwards lands awkwardly and heads to the locker room",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room",
            "publishedAt": "2025-04-03",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-ankle-2025-001-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2025-04-04",
              "publisher": "NBA.com",
              "title": "Nightly Pulse: NBA News & Highlights from April 3",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-ankle-2025-001-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Nightly Pulse: NBA News & Highlights from April 3",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3",
              "publishedAt": "2025-04-04",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-ankle-2025-001-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2025-04-03",
            "publisher": "NBA",
            "title": "Anthony Edwards lands awkwardly and heads to the locker room",
            "url": "https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-ankle-2025-001-event",
            "type": "event-context",
            "title": "Anthony Edwards lands awkwardly and heads to the locker room",
            "publisher": "NBA",
            "independenceGroup": "nba",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room",
            "publishedAt": "2025-04-03",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-ankle-2025-001-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-ankle-2025-001-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Anthony Edwards, 2025-04-03, Minnesota Timberwolves vs. Brooklyn Nets, and nba-regular-season; the diagnosis explicitly supports “NBA.com reported that Anthony Edwards sustained an ankle sprain in the game.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/18",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/18/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/72",
            "/results/73",
            "/results/74",
            "/results/75"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/18",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-ankle-12-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-ankle-12-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-ankle-12-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T10:08:25Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-ankle-12-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-ankle-12-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-ankle-12-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-ankle-12-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-ankle-12-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-ankle-12-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-ankle-12-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-ankle-12-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-achilles-01",
      "candidateId": "CAND-NBA-ACHILLES-2019-005",
      "caseId": "CASE-NBAACHILLES-2019-005",
      "slug": "kevin-durant-achilles-rupture-2019",
      "path": "src/content/cases/kevin-durant-achilles-rupture-2019.json",
      "entryDigest": "d718b475799a1ca3e38a1daeb7c8133ca4c8a93b710d37a315a943d19f4e3d21",
      "injuryCode": "achilles-rupture",
      "frozenIdentity": {
        "athleteDisplayName": "Kevin Durant",
        "teamAtEvent": "Golden State Warriors",
        "opponent": "Toronto Raptors",
        "season": "2018-19",
        "eventDate": "2019-06-10",
        "competition": "nba-playoffs",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-achilles-2019-005-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury",
            "captionCheckedAt": "2026-08-07T11:34:14Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:34:14Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; player controls opened and no caption/subtitle control or text track was observable.",
            "provenanceCheckedAt": "2026-08-07T11:34:14Z",
            "provenanceCheckedBy": "Codex Achilles source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2019-06-10",
            "title": "Kevin Durant leaves Game 5 with injury",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2019-005-video",
            "type": "video-original",
            "title": "Kevin Durant leaves Game 5 with injury",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury",
            "publishedAt": "2019-06-10",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-achilles-2019-005-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2019-06-13",
              "publisher": "NBA.com",
              "title": "Kevin Durant confirms he suffered ruptured right Achilles",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/warriors-durant-achilles-injury-update"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-achilles-2019-005-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Kevin Durant confirms he suffered ruptured right Achilles",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/warriors-durant-achilles-injury-update",
              "publishedAt": "2019-06-13",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-achilles-2019-005-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2019-06-10",
            "publisher": "NBA.com",
            "title": "Kevin Durant leaves Game 5 with injury",
            "url": "https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2019-005-event",
            "type": "event-context",
            "title": "Kevin Durant leaves Game 5 with injury",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury",
            "publishedAt": "2019-06-10",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-achilles-2019-005-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-achilles-2019-005-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Kevin Durant, 2019-06-10, Golden State Warriors vs. Toronto Raptors, and nba-playoffs; the diagnosis explicitly supports “Ruptured right Achilles tendon.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/19",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/19/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/warriors-durant-achilles-injury-update"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/76",
            "/results/77",
            "/results/78",
            "/results/79"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/19",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-achilles-01-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-achilles-01-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-achilles-01-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-achilles-01-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-achilles-01-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-achilles-01-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-achilles-01-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-achilles-01-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-achilles-01-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-achilles-01-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-achilles-01-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-achilles-02",
      "candidateId": "CAND-NBA-ACHILLES-2020-008",
      "caseId": "CASE-NBAACHILLES-2020-008",
      "slug": "dwight-powell-achilles-rupture-2020",
      "path": "src/content/cases/dwight-powell-achilles-rupture-2020.json",
      "entryDigest": "1121b1f4fc21dc562267ca5a104e66f4a733a5e9639cf0bcba225c1a1f88f217",
      "injuryCode": "achilles-rupture",
      "frozenIdentity": {
        "athleteDisplayName": "Dwight Powell",
        "teamAtEvent": "Dallas Mavericks",
        "opponent": "LA Clippers",
        "season": "2019-20",
        "eventDate": "2020-01-21",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-achilles-2020-008-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/dwight-powell-injury",
            "captionCheckedAt": "2026-08-07T11:34:14Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:34:14Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; player controls opened and no caption/subtitle control or text track was observable.",
            "provenanceCheckedAt": "2026-08-07T11:34:14Z",
            "provenanceCheckedBy": "Codex Achilles source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2020-01-21",
            "title": "Dwight Powell injury",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2020-008-video",
            "type": "video-original",
            "title": "Dwight Powell injury",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/dwight-powell-injury",
            "publishedAt": "2020-01-21",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-achilles-2020-008-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2020-01-28",
              "publisher": "NBA.com",
              "title": "Dwight Powell has surgery on Achilles",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/dwight-powell-has-surgery-achilles"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-achilles-2020-008-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Dwight Powell has surgery on Achilles",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/dwight-powell-has-surgery-achilles",
              "publishedAt": "2020-01-28",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-achilles-2020-008-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2020-01-21",
            "publisher": "NBA.com",
            "title": "Dwight Powell injury",
            "url": "https://www.nba.com/watch/video/dwight-powell-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2020-008-event",
            "type": "event-context",
            "title": "Dwight Powell injury",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/dwight-powell-injury",
            "publishedAt": "2020-01-21",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-achilles-2020-008-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-achilles-2020-008-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Dwight Powell, 2020-01-21, Dallas Mavericks vs. LA Clippers, and nba-regular-season; the diagnosis explicitly supports “Ruptured right Achilles tendon.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/20",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/20/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/dwight-powell-has-surgery-achilles"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/80",
            "/results/81",
            "/results/82",
            "/results/83"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/20",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-achilles-02-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/dwight-powell-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-achilles-02-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-achilles-02-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-achilles-02-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-achilles-02-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-achilles-02-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-achilles-02-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-achilles-02-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-achilles-02-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-achilles-02-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-achilles-02-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-achilles-03",
      "candidateId": "CAND-NBA-ACHILLES-2023-010",
      "caseId": "CASE-NBAACHILLES-2023-010",
      "slug": "brandon-clarke-achilles-rupture-2023",
      "path": "src/content/cases/brandon-clarke-achilles-rupture-2023.json",
      "entryDigest": "74c724ef2d554239f43b5df0c2c8137363118b6766e6d0177a15b5fff2ff868d",
      "injuryCode": "achilles-rupture",
      "frozenIdentity": {
        "athleteDisplayName": "Brandon Clarke",
        "teamAtEvent": "Memphis Grizzlies",
        "opponent": "Denver Nuggets",
        "season": "2022-23",
        "eventDate": "2023-03-03",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-achilles-2023-010-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury",
            "captionCheckedAt": "2026-08-07T11:34:14Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:34:14Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; player controls opened and no caption/subtitle control or text track was observable.",
            "provenanceCheckedAt": "2026-08-07T11:34:14Z",
            "provenanceCheckedBy": "Codex Achilles source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2023-03-03",
            "title": "Brandon Clarke leaves the game due to injury",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2023-010-video",
            "type": "video-original",
            "title": "Brandon Clarke leaves the game due to injury",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury",
            "publishedAt": "2023-03-03",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-achilles-2023-010-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "memphis-grizzlies",
              "originReportId": null,
              "publishedAt": "2023-03-04",
              "publisher": "Memphis Grizzlies",
              "title": "Memphis Grizzlies Medical Update",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/grizzlies/news/memphis-grizzlies-medical-update-030423"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-achilles-2023-010-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Memphis Grizzlies Medical Update",
              "publisher": "Memphis Grizzlies",
              "independenceGroup": "memphis-grizzlies",
              "originReportId": null,
              "url": "https://www.nba.com/grizzlies/news/memphis-grizzlies-medical-update-030423",
              "publishedAt": "2023-03-04",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-achilles-2023-010-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2023-03-03",
            "publisher": "NBA.com",
            "title": "Brandon Clarke leaves the game due to injury",
            "url": "https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2023-010-event",
            "type": "event-context",
            "title": "Brandon Clarke leaves the game due to injury",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury",
            "publishedAt": "2023-03-03",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-achilles-2023-010-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-achilles-2023-010-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Brandon Clarke, 2023-03-03, Memphis Grizzlies vs. Denver Nuggets, and nba-regular-season; the diagnosis explicitly supports “Torn left Achilles.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/21",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/21/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/grizzlies/news/memphis-grizzlies-medical-update-030423"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/84",
            "/results/85",
            "/results/86",
            "/results/87"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/21",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-achilles-03-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-achilles-03-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-achilles-03-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-achilles-03-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-achilles-03-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-achilles-03-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-achilles-03-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-achilles-03-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-achilles-03-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-achilles-03-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-achilles-03-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-achilles-04",
      "candidateId": "CAND-NBA-ACHILLES-2025-014",
      "caseId": "CASE-NBAACHILLES-2025-014",
      "slug": "dejounte-murray-achilles-rupture-2025",
      "path": "src/content/cases/dejounte-murray-achilles-rupture-2025.json",
      "entryDigest": "f86897663c4e68cc1449baf8cb9b3cacbbe7c1a28537b03ae8e7f2aa340ed4b7",
      "injuryCode": "achilles-rupture",
      "frozenIdentity": {
        "athleteDisplayName": "Dejounte Murray",
        "teamAtEvent": "New Orleans Pelicans",
        "opponent": "Boston Celtics",
        "season": "2024-25",
        "eventDate": "2025-01-31",
        "competition": "nba-regular-season",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-achilles-2025-014-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31",
            "captionCheckedAt": "2026-08-07T11:34:14Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:34:14Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; player controls opened and no caption/subtitle control or text track was observable.",
            "provenanceCheckedAt": "2026-08-07T11:34:14Z",
            "provenanceCheckedBy": "Codex Achilles source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2025-01-31",
            "title": "Dejounte Murray suffers lower right leg injury, exits early vs. Celtics",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2025-014-video",
            "type": "video-original",
            "title": "Dejounte Murray suffers lower right leg injury, exits early vs. Celtics",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31",
            "publishedAt": "2025-01-31",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-achilles-2025-014-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "nba",
              "originReportId": null,
              "publishedAt": "2025-02-02",
              "publisher": "NBA.com",
              "title": "Pelicans guard Dejounte Murray out for season with torn right Achilles tendon",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/news/pelicans-murray-injury"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-achilles-2025-014-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Pelicans guard Dejounte Murray out for season with torn right Achilles tendon",
              "publisher": "NBA.com",
              "independenceGroup": "nba",
              "originReportId": null,
              "url": "https://www.nba.com/news/pelicans-murray-injury",
              "publishedAt": "2025-02-02",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-achilles-2025-014-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2025-01-31",
            "publisher": "NBA.com",
            "title": "Dejounte Murray suffers lower right leg injury, exits early vs. Celtics",
            "url": "https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2025-014-event",
            "type": "event-context",
            "title": "Dejounte Murray suffers lower right leg injury, exits early vs. Celtics",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31",
            "publishedAt": "2025-01-31",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-achilles-2025-014-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-achilles-2025-014-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Dejounte Murray, 2025-01-31, New Orleans Pelicans vs. Boston Celtics, and nba-regular-season; the diagnosis explicitly supports “Ruptured right Achilles tendon.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/22",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/22/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/news/pelicans-murray-injury"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/88",
            "/results/89",
            "/results/90",
            "/results/91"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/22",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-achilles-04-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-achilles-04-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-achilles-04-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-achilles-04-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-achilles-04-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-achilles-04-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-achilles-04-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-achilles-04-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-achilles-04-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-achilles-04-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-achilles-04-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-achilles-05",
      "candidateId": "CAND-NBA-ACHILLES-2025-015",
      "caseId": "CASE-NBAACHILLES-2025-015",
      "slug": "damian-lillard-achilles-rupture-2025",
      "path": "src/content/cases/damian-lillard-achilles-rupture-2025.json",
      "entryDigest": "6edd5cb52a8e2f12e89256a96f84d8fc1c0001979804113e93ec2f0289c9b20c",
      "injuryCode": "achilles-rupture",
      "frozenIdentity": {
        "athleteDisplayName": "Damian Lillard",
        "teamAtEvent": "Milwaukee Bucks",
        "opponent": "Indiana Pacers",
        "season": "2024-25",
        "eventDate": "2025-04-27",
        "competition": "nba-playoffs",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-achilles-2025-015-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers",
            "captionCheckedAt": "2026-08-07T12:06:06Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T12:06:06Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; player controls opened and no caption/subtitle control or text track was observable.",
            "provenanceCheckedAt": "2026-08-07T12:06:06Z",
            "provenanceCheckedBy": "Codex Achilles source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2025-04-27",
            "title": "Damian Lillard suffers lower left leg injury, exits in 1st quarter of Game 4 vs. Pacers",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2025-015-video",
            "type": "video-original",
            "title": "Damian Lillard suffers lower left leg injury, exits in 1st quarter of Game 4 vs. Pacers",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers",
            "publishedAt": "2025-04-27",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-achilles-2025-015-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "milwaukee-bucks",
              "originReportId": null,
              "publishedAt": "2025-04-28",
              "publisher": "Milwaukee Bucks",
              "title": "Medical Update on Damian Lillard",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/bucks/news/medical-update-on-damian-lillard-3"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-achilles-2025-015-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Medical Update on Damian Lillard",
              "publisher": "Milwaukee Bucks",
              "independenceGroup": "milwaukee-bucks",
              "originReportId": null,
              "url": "https://www.nba.com/bucks/news/medical-update-on-damian-lillard-3",
              "publishedAt": "2025-04-28",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-achilles-2025-015-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2025-04-27",
            "publisher": "NBA.com",
            "title": "Damian Lillard suffers lower left leg injury, exits in 1st quarter of Game 4 vs. Pacers",
            "url": "https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2025-015-event",
            "type": "event-context",
            "title": "Damian Lillard suffers lower left leg injury, exits in 1st quarter of Game 4 vs. Pacers",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers",
            "publishedAt": "2025-04-27",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-achilles-2025-015-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-achilles-2025-015-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Damian Lillard, 2025-04-27, Milwaukee Bucks vs. Indiana Pacers, and nba-playoffs; the diagnosis explicitly supports “Torn left Achilles tendon.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/23",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/23/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/bucks/news/medical-update-on-damian-lillard-3"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/92",
            "/results/93",
            "/results/94",
            "/results/95"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/23",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-achilles-05-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-achilles-05-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T12:06:06Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-achilles-05-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T12:06:06Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-achilles-05-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-achilles-05-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-achilles-05-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-achilles-05-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-achilles-05-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-achilles-05-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-achilles-05-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-achilles-05-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-achilles-06",
      "candidateId": "CAND-NBA-ACHILLES-2025-016",
      "caseId": "CASE-NBAACHILLES-2025-016",
      "slug": "jayson-tatum-achilles-rupture-2025",
      "path": "src/content/cases/jayson-tatum-achilles-rupture-2025.json",
      "entryDigest": "d9b0468b2b683bed03141a48b8d839fd751d923eb49ca6a98afca713174bc171",
      "injuryCode": "achilles-rupture",
      "frozenIdentity": {
        "athleteDisplayName": "Jayson Tatum",
        "teamAtEvent": "Boston Celtics",
        "opponent": "New York Knicks",
        "season": "2024-25",
        "eventDate": "2025-05-12",
        "competition": "nba-playoffs",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-achilles-2025-016-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4",
            "captionCheckedAt": "2026-08-07T11:34:14Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:34:14Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; player controls opened and no caption/subtitle control or text track was observable.",
            "provenanceCheckedAt": "2026-08-07T11:34:14Z",
            "provenanceCheckedBy": "Codex Achilles source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2025-05-12",
            "title": "Jayson Tatum suffers right lower leg injury late in Game 4, exits early vs. Knicks",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2025-016-video",
            "type": "video-original",
            "title": "Jayson Tatum suffers right lower leg injury late in Game 4, exits early vs. Knicks",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4",
            "publishedAt": "2025-05-12",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-achilles-2025-016-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "boston-celtics",
              "originReportId": null,
              "publishedAt": "2025-05-13",
              "publisher": "Boston Celtics",
              "title": "Jayson Tatum Injury Update",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/celtics/news/press-release-20250513-jayson-tatum-injury-update"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-achilles-2025-016-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Jayson Tatum Injury Update",
              "publisher": "Boston Celtics",
              "independenceGroup": "boston-celtics",
              "originReportId": null,
              "url": "https://www.nba.com/celtics/news/press-release-20250513-jayson-tatum-injury-update",
              "publishedAt": "2025-05-13",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-achilles-2025-016-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2025-05-12",
            "publisher": "NBA.com",
            "title": "Jayson Tatum suffers right lower leg injury late in Game 4, exits early vs. Knicks",
            "url": "https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2025-016-event",
            "type": "event-context",
            "title": "Jayson Tatum suffers right lower leg injury late in Game 4, exits early vs. Knicks",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4",
            "publishedAt": "2025-05-12",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-achilles-2025-016-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-achilles-2025-016-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Jayson Tatum, 2025-05-12, Boston Celtics vs. New York Knicks, and nba-playoffs; the diagnosis explicitly supports “Ruptured right Achilles tendon.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/24",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/24/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/celtics/news/press-release-20250513-jayson-tatum-injury-update"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/96",
            "/results/97",
            "/results/98",
            "/results/99"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/24",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-achilles-06-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-achilles-06-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-achilles-06-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-achilles-06-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-achilles-06-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-achilles-06-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-achilles-06-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-achilles-06-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-achilles-06-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-achilles-06-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-achilles-06-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    },
    {
      "taskId": "case-achilles-07",
      "candidateId": "CAND-NBA-ACHILLES-2025-017",
      "caseId": "CASE-NBAACHILLES-2025-017",
      "slug": "tyrese-haliburton-achilles-rupture-2025",
      "path": "src/content/cases/tyrese-haliburton-achilles-rupture-2025.json",
      "entryDigest": "9341384e98fde6234074002d29eb97f0ca990f8899890ad4dcfecaf9f4ee0c56",
      "injuryCode": "achilles-rupture",
      "frozenIdentity": {
        "athleteDisplayName": "Tyrese Haliburton",
        "teamAtEvent": "Indiana Pacers",
        "opponent": "Oklahoma City Thunder",
        "season": "2024-25",
        "eventDate": "2025-06-22",
        "competition": "nba-playoffs",
        "isClassic": false,
        "classicReason": null,
        "classicProposedBy": null,
        "sourceStatus": "source-verified",
        "supersedes": null
      },
      "plannedSourceMappings": {
        "videoOriginal": {
          "plannedSourceId": "src-nba-achilles-2025-017-video",
          "sourceType": "video-original",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "canonicalUrl": "https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals",
            "captionCheckedAt": "2026-08-07T11:34:14Z",
            "captionStatus": "unavailable",
            "channelUrl": "https://www.nba.com/watch/featured",
            "contentType": "in-game-injury-event",
            "embedCheckedAt": "2026-08-07T11:34:14Z",
            "embedStatus": "external-link-only",
            "provenanceBasis": "NBA.com original-platform Watch page with NBA Organization publisher attribution; player controls opened and no caption/subtitle control or text track was observable.",
            "provenanceCheckedAt": "2026-08-07T11:34:14Z",
            "provenanceCheckedBy": "Codex Achilles source researcher",
            "provenanceStatus": "verified",
            "provider": "nba",
            "publishedAt": "2025-06-22",
            "title": "2025 NBA Finals: Tyrese Haliburton suffers right lower leg injury, exits Game 7",
            "uploaderName": "NBA Organization",
            "uploaderProvenance": "league"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2025-017-video",
            "type": "video-original",
            "title": "2025 NBA Finals: Tyrese Haliburton suffers right lower leg injury, exits Game 7",
            "publisher": "NBA Organization",
            "independenceGroup": "nba-organization",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals",
            "publishedAt": "2025-06-22",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened",
              "general.whatIsVisible",
              "video.segmentObservation"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.video.title",
            "publisher": "exact manifest.video.uploaderName",
            "independenceGroup": "deterministic lower-kebab of exact manifest.video.uploaderName",
            "originReportId": "planned null because the frozen video record declares no originReportId",
            "url": "exact manifest.video.canonicalUrl",
            "publishedAt": "exact manifest.video.publishedAt",
            "accessedAt": "exact manifest.video.accessedAt",
            "supports": "contract-compatible planned assignment for video-original"
          }
        },
        "diagnosis": [
          {
            "plannedSourceId": "src-nba-achilles-2025-017-diagnosis-01",
            "sourceType": "diagnosis-first-party",
            "manifestArrayIndex": 0,
            "manifestRecord": {
              "accessedAt": "2026-08-07",
              "independenceGroup": "indiana-pacers",
              "originReportId": null,
              "publishedAt": "2025-06-23",
              "publisher": "Indiana Pacers",
              "title": "Indiana Pacers Medical Update",
              "type": "diagnosis-first-party",
              "url": "https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623"
            },
            "mappingStatus": "planned-authoring-mapping-from-frozen-record",
            "plannedCaseSource": {
              "id": "src-nba-achilles-2025-017-diagnosis-01",
              "type": "diagnosis-first-party",
              "title": "Indiana Pacers Medical Update",
              "publisher": "Indiana Pacers",
              "independenceGroup": "indiana-pacers",
              "originReportId": null,
              "url": "https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623",
              "publishedAt": "2025-06-23",
              "accessedAt": "2026-08-07",
              "supports": [
                "injury.confirmedDiagnosis",
                "general.confirmedUpdate"
              ]
            },
            "mappingBasis": {
              "title": "exact manifest diagnosis-source title",
              "publisher": "exact manifest diagnosis-source publisher",
              "independenceGroup": "exact manifest diagnosis-source independenceGroup",
              "originReportId": "exact manifest diagnosis-source originReportId",
              "url": "exact manifest diagnosis-source URL",
              "publishedAt": "exact manifest diagnosis-source publishedAt",
              "accessedAt": "exact manifest diagnosis-source accessedAt",
              "supports": "contract-compatible planned assignment for diagnosis source type"
            }
          }
        ],
        "eventContext": {
          "plannedSourceId": "src-nba-achilles-2025-017-event",
          "sourceType": "event-context",
          "manifestRecord": {
            "accessedAt": "2026-08-07",
            "publishedAt": "2025-06-22",
            "publisher": "NBA.com",
            "title": "2025 NBA Finals: Tyrese Haliburton suffers right lower leg injury, exits Game 7",
            "url": "https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals"
          },
          "mappingStatus": "planned-authoring-mapping-not-frozen-fact",
          "plannedCaseSource": {
            "id": "src-nba-achilles-2025-017-event",
            "type": "event-context",
            "title": "2025 NBA Finals: Tyrese Haliburton suffers right lower leg injury, exits Game 7",
            "publisher": "NBA.com",
            "independenceGroup": "nba-com",
            "originReportId": null,
            "url": "https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals",
            "publishedAt": "2025-06-22",
            "accessedAt": "2026-08-07",
            "supports": [
              "general.whatHappened"
            ]
          },
          "mappingBasis": {
            "title": "exact manifest.eventSource.title",
            "publisher": "exact manifest.eventSource.publisher",
            "independenceGroup": "deterministic lower-kebab of exact manifest.eventSource.publisher",
            "originReportId": "planned null because the frozen event source declares no originReportId",
            "url": "exact manifest.eventSource.url",
            "publishedAt": "exact manifest.eventSource.publishedAt",
            "accessedAt": "exact manifest.eventSource.accessedAt",
            "supports": "contract-compatible planned assignment for event-context"
          }
        },
        "teachingEvidenceIdPrefix": "src-nba-achilles-2025-017-teaching-",
        "teachingEvidence": {
          "mappingStatus": "future-authorized-research-required-no-frozen-record",
          "plannedSourceIdPrefix": "src-nba-achilles-2025-017-teaching-",
          "sourceType": "teaching-evidence",
          "allowedSupports": [
            "professional.mechanismAnalysis",
            "professional.clinicalLimitations",
            "professional.differentialContext",
            "professional.treatmentAndRtpMeaning"
          ],
          "constraint": "Select current primary research/guidelines during separately authorized authoring; do not derive teaching claims from event, diagnosis-news, or video records."
        }
      },
      "frozenProvenance": {
        "eventBinding": {
          "basis": "PASS — Browser reopened the original event/video and first-party diagnosis pages. The combined visible title, date, event context, and first-party text matched Tyrese Haliburton, 2025-06-22, Indiana Pacers vs. Oklahoma City Thunder, and nba-playoffs; the diagnosis explicitly supports “Torn right Achilles tendon.” No duplicate accepted event identity or canonical video URL was found, and no extra grade, mechanism, surgery, prognosis, rehabilitation, or return-to-play claim was inferred. The diagnosis page is distinct from the event/video page; only the diagnosis page is treated as diagnostic evidence.",
          "rootAuditReference": "/candidates/25",
          "status": "passed"
        },
        "firstPartyAvailability": {
          "archiveOrSearchChecks": [],
          "auditReference": "/candidates/25/firstPartyAvailability",
          "basis": null,
          "checkedAt": "2026-08-07T15:06:49Z",
          "checkedBy": "Codex root source auditor",
          "officialLocationsChecked": [
            {
              "observedAt": "2026-08-07T15:06:49Z",
              "outcome": "Opened original first-party diagnosis page in Browser; explicit written diagnosis matched the athlete and stored injury claim.",
              "url": "https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623"
            }
          ],
          "status": "available"
        },
        "sourceReviewDecision": {
          "digest": "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
          "reviewedAt": "2026-08-07T15:31:19Z",
          "reviewedBy": "吳易澄醫師"
        },
        "verification": {
          "artifactDigest": "aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0",
          "resultReferences": [
            "/results/100",
            "/results/101",
            "/results/102",
            "/results/103"
          ],
          "rootAuditDigest": "15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76",
          "rootAuditReference": "/candidates/25",
          "rootAuditStatus": "passed"
        }
      },
      "authoringSections": [
        "schemaVersion",
        "id",
        "slug",
        "status",
        "sourceManifestBinding",
        "sport",
        "league",
        "competition",
        "athlete",
        "teamAtEvent",
        "season",
        "eventDate",
        "opponent",
        "injury",
        "observedMechanismTags",
        "isClassic",
        "classicReason",
        "classicProposedBy",
        "classicExceptionApprovedBy",
        "video.eventBinding",
        "video.canonicalUrl",
        "video.provider",
        "video.contentType",
        "video.uploaderName",
        "video.uploaderProvenance",
        "video.sourceProvenanceVerification",
        "video.embedStatus",
        "video.embedCheckedAt",
        "video.captionStatus",
        "video.captionCheckedAt",
        "video.durationSeconds",
        "video.startSeconds",
        "video.endSeconds",
        "video.publicRightsReview",
        "video.segments",
        "general.whatHappened",
        "general.whatIsVisible",
        "general.whatVideoCannotProve",
        "general.confirmedUpdate",
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
        "professional.claims",
        "professional.evidenceIds",
        "professional.rtpCourseKey",
        "sources",
        "review",
        "audit"
      ],
      "timecodeVerification": {
        "taskId": "case-achilles-07-timecode-verification",
        "canonicalVideoUrl": "https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals",
        "durationSeconds": {
          "plannedValue": null,
          "requiredDerivation": "inspect the original-platform video during separately authorized authoring",
          "constraints": [
            "integer >= 1",
            "must not be derived or fabricated from frozen manifest metadata"
          ]
        },
        "startSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event start during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be < endSeconds",
            "must be <= durationSeconds"
          ]
        },
        "endSeconds": {
          "plannedValue": null,
          "requiredDerivation": "select the bounded event end during the same authorized original-video inspection",
          "constraints": [
            "integer >= 0",
            "must be > startSeconds",
            "must be <= durationSeconds"
          ]
        },
        "orderedSegments": {
          "plannedValue": null,
          "requiredDerivation": "record ordered visible-only observations from the authorized original-video inspection",
          "constraints": [
            "each segment startSeconds < endSeconds",
            "each segment lies within the selected video window and duration",
            "segments are ordered and non-overlapping",
            "observations do not diagnose or infer unwritten medical facts"
          ]
        },
        "currentEmbedCheck": {
          "taskId": "case-achilles-07-embed-current-check",
          "frozenStatus": "external-link-only",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts"
        },
        "currentCaptionCheck": {
          "taskId": "case-achilles-07-caption-current-check",
          "frozenStatus": "unavailable",
          "frozenCheckedAt": "2026-08-07T11:34:14Z",
          "requiredAction": "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts"
        },
        "immutableG2Constraint": "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry."
      },
      "testOrder": [
        {
          "order": 1,
          "phase": "red-missing",
          "testId": "case-achilles-07-test-01-red-missing",
          "assertion": "missing case file must fail exact coverage/content/route assertion"
        },
        {
          "order": 2,
          "phase": "schema",
          "testId": "case-achilles-07-test-02-schema",
          "assertion": "case schema and exact filename/slug validation"
        },
        {
          "order": 3,
          "phase": "binding",
          "testId": "case-achilles-07-test-03-binding",
          "assertion": "registered rich-manifest binding and frozen-fact drift validation"
        },
        {
          "order": 4,
          "phase": "evidence",
          "testId": "case-achilles-07-test-04-evidence",
          "assertion": "source-type/support compatibility and atomic teaching-evidence validation"
        },
        {
          "order": 5,
          "phase": "timecode",
          "testId": "case-achilles-07-test-05-timecode",
          "assertion": "duration/window/ordered-segment bounds and current embed/caption behavior"
        },
        {
          "order": 6,
          "phase": "digest",
          "testId": "case-achilles-07-test-06-digest",
          "assertion": "clinical and video-source digest stability/staleness validation"
        },
        {
          "order": 7,
          "phase": "route",
          "testId": "case-achilles-07-test-07-route",
          "assertion": "exact case, injury, and league route identity validation"
        },
        {
          "order": 8,
          "phase": "review-build",
          "testId": "case-achilles-07-test-08-review-build",
          "assertion": "review-mode build and review UI record/digest identity validation"
        }
      ],
      "reviewTarget": {
        "caseStatus": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        },
        "publicRightsReview": {
          "status": "not-requested",
          "reviewedBy": null,
          "reviewedAt": null,
          "reviewedVideoDigest": null,
          "policyVersion": null,
          "termsCheckedAt": null,
          "decisionBasis": null,
          "notes": null,
          "decisionPath": null,
          "decisionDigest": null
        }
      }
    }
  ],
  "overviewCount": 3,
  "overviews": [
    {
      "injuryCode": "acl",
      "taskId": "overview-acl",
      "path": "src/content/injuries/acl.json",
      "reviewTarget": {
        "status": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        }
      }
    },
    {
      "injuryCode": "ankle-sprain",
      "taskId": "overview-ankle-sprain",
      "path": "src/content/injuries/ankle-sprain.json",
      "reviewTarget": {
        "status": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        }
      }
    },
    {
      "injuryCode": "achilles-rupture",
      "taskId": "overview-achilles-rupture",
      "path": "src/content/injuries/achilles-rupture.json",
      "reviewTarget": {
        "status": "medical-review",
        "review": {
          "status": "in-review",
          "reviewerName": null,
          "reviewerQualification": null,
          "reviewedAt": null,
          "reviewedContentDigest": null
        }
      }
    }
  ],
  "baselineUpdate": {
    "taskId": "baseline-update-2026-q3",
    "id": "2026-q3",
    "path": "src/content/updates/2026-q3.json",
    "period": {
      "year": 2026,
      "quarter": 3,
      "startDate": "2026-07-01",
      "endDate": "2026-09-30"
    },
    "plannedAddedCaseIds": [
      "CASE-NBAACL-2021-009",
      "CASE-NBAACL-2021-010",
      "CASE-NBAACL-2021-015",
      "CASE-NBAACL-2022-016",
      "CASE-NBAACL-2022-017",
      "CASE-NBAACL-2024-023",
      "CASE-NBAACL-2025-021",
      "CASE-NBAANKLE-2020-002",
      "CASE-NBAANKLE-2020-001",
      "CASE-NBAANKLE-2021-003",
      "CASE-NBAANKLE-2021-001",
      "CASE-NBAANKLE-2021-002",
      "CASE-NBAANKLE-2022-001",
      "CASE-NBAANKLE-2023-004",
      "CASE-NBAANKLE-2023-001",
      "CASE-NBAANKLE-2023-008",
      "CASE-NBAANKLE-2024-001",
      "CASE-NBAANKLE-2025-002",
      "CASE-NBAANKLE-2025-001",
      "CASE-NBAACHILLES-2019-005",
      "CASE-NBAACHILLES-2020-008",
      "CASE-NBAACHILLES-2023-010",
      "CASE-NBAACHILLES-2025-014",
      "CASE-NBAACHILLES-2025-015",
      "CASE-NBAACHILLES-2025-016",
      "CASE-NBAACHILLES-2025-017"
    ],
    "executionFreshness": {
      "latestAuthorizedStartDate": "2026-09-30",
      "stopAction": "If authorized execution begins after 2026-09-30, stop; create, authorize, and bind a replacement current-quarter authoring plan before editing content."
    },
    "reviewTarget": {
      "status": "medical-review",
      "publishedAt": null,
      "review": {
        "status": "in-review",
        "reviewerName": null,
        "reviewerQualification": null,
        "reviewedAt": null,
        "reviewedContentDigest": null
      }
    }
  }
}
```
<!-- END NBA_CASE_AUTHORING_COVERAGE_V1 -->

## Completion and stop conditions

- This Task 6 planning artifact is complete only when its 26-case/three-overview/one-baseline coverage parses, matches the registered Task 5 manifest one-to-one, passes plan-binding verification, and is committed with a `not-authorized` binding.
- Future G3 execution is complete only after the narrow rich-manifest binding prerequisite, all 26 cases, all three overviews, the real Q3 baseline, tests, clean content commit, and canonical review-set handoff are complete and green.
- Neither condition authorizes named medical approval, private hosting, public release, deployment, remote/push, or indexing. Those remain explicit later stop gates.
