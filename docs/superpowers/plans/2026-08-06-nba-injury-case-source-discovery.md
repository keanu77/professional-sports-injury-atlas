# NBA Injury Case Source Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為 ACL、腳踝扭傷與阿基里斯腱斷裂建立可追溯的 NBA 候選案例清單，逐案驗證事件去重、正式診斷來源、影片原始上傳者／權利方 provenance 與嵌入／外連狀態，最後產生每傷種至少 10 筆、總數至少 30 筆的 source-verified authoring manifest；本階段不撰寫醫療教學內容、不做醫療核准或公開權利核准。

**Architecture:** 三個傷種各有獨立 RFC 4180 CSV，讓研究 agents 使用互斥路徑平行工作。Strict parser 與 pure validators 先固定欄位、日期、來源獨立性、經典案例、影片 provenance 與去重規則。Live link verification 是低併發、可重試的獨立步驟，不耦合一般 build。Root 對每一筆納入列打開原頁重查；具名內容負責人完成來源審閱後，generator 才從三份 CSV 產生 canonical JSON manifest 與 SHA-256 handoff。

**Tech Stack:** Existing Atlas Node/Astro repository、TypeScript、`csv-parse` 7.0.2、Vitest、Node fetch、canonical JSON／SHA-256、browser-assisted manual source review。

---

## Preconditions and scope

- Execution role: `nba-injury-case-source-discovery`; execution scope ID: `nba-source-discovery-only`; required closed scope IDs: `medical-content-authoring`, `private-hosting`, `public-release`, `deployment`.
- Gate G1 platform foundation is complete and the atlas local repository is clean.
- The exact source-discovery plan and its date-stamped user decision are present in `plan-binding.v1.json`; `npm run plan:assert-authorized -- docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md` exits `0`. Repository/platform authorization alone is insufficient.
- Work takes place under `professional-sports-injury-atlas/`.
- Every new research shell activates the exact Atlas Node 24.14.0 runtime recorded in the platform plan before an npm command.
- This research requires current web browsing because video availability, injury reports, uploader identity, and platform terms can change.
- Discovery agents may search broadly, but an entry may cite only a source page they actually opened.
- No video, audio, screenshot, thumbnail, transcript, article body, or copyrighted media is downloaded into the repository.
- Short factual paraphrases, page titles, publisher names, dates, canonical URLs, and verification outcomes may be stored.
- Search-result snippets, social reposts, anonymous accounts, compilation channels, fan edits, slow-motion inference, and broadcaster speculation cannot confirm diagnosis.
- `source-verified` means ready for case authoring only. It never means medically reviewed, publicly releasable, legally licensed, or safe to index.
- Researchers use `source-ready` after all source fields pass. Only the named content owner may promote a root-audited row to `source-verified`.
- This plan creates exactly one immutable launch batch: `manifestId=NBA-SOURCE-2026-08-06-001`, `batchType=launch`, `period=2026-08-06`, manifest path `research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json`, and decision path `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json`. Both are absent before their planned creation and neither may be overwritten; the only accepted pre-existing manifest is a byte-identical, unregistered orphan recovered by the strict crash-recovery path below, or the already registered byte-identical result on an idempotent rerun.
- `research/source-manifest-registry.v1.json` must begin as the exact canonical empty registry created by the platform plan. This plan appends one terminal entry. Later quarters/corrections require a new date-stamped authorized plan and new manifest ID/path; they never rewrite this launch batch or its review decision.

## Candidate volume and date rules

- Rolling recent-case cutoff is fixed for this first pass at `2016-08-06`.
- Each injury research file begins with at least 15 plausible candidates to allow attrition.
- This launch manifest has at least 10 source-verified entries per injury and at least 30 total.
- Across this launch manifest, recent source-verified cases must outnumber classic cases, and at least one qualified classic case must be present because the approved product includes representative classics.
- A qualified classic in each injury is a curation target, not a hard gate. Record gaps by injury and never lower standards to fill them.
- There is no upper limit: every additional candidate that passes all source rules remains in the manifest.

## Exact CSV contract

All three candidate files use this exact header, in this order:

```csv
candidate_id,injury_code,athlete_display_name,team_at_event,season,event_date,opponent,competition,is_classic,classic_reason,video_provider,video_content_type,video_canonical_url,video_title,video_uploader_name,video_uploader_provenance,video_channel_url,video_published_at,video_accessed_at,embed_status,embed_checked_at,caption_status,caption_checked_at,video_provenance_basis,provenance_check_status,provenance_checked_by,provenance_checked_at,diagnosis_status,diagnosis_claim,first_party_availability_status,first_party_unavailability_basis,first_party_availability_checked_by,first_party_availability_checked_at,first_party_availability_audit_ref,diagnosis_source_1_type,diagnosis_source_1_title,diagnosis_source_1_publisher,diagnosis_source_1_independence_group,diagnosis_source_1_origin_report_id,diagnosis_source_1_url,diagnosis_source_1_published_at,diagnosis_source_1_accessed_at,diagnosis_source_2_type,diagnosis_source_2_title,diagnosis_source_2_publisher,diagnosis_source_2_independence_group,diagnosis_source_2_origin_report_id,diagnosis_source_2_url,diagnosis_source_2_published_at,diagnosis_source_2_accessed_at,event_source_title,event_source_publisher,event_source_url,event_source_published_at,event_source_accessed_at,discovery_status,exclusion_reason,checked_at,reviewed_by,reviewed_at
```

Controlled tokens:

```ts
type CandidateInjuryCode = 'acl' | 'ankle-sprain' | 'achilles-rupture';
type CandidateEmbedStatus = 'unchecked' | 'verified' | 'external-link-only' | 'unavailable';
type CandidateCaptionStatus = 'not-verified' | 'available' | 'unavailable';
type CandidateVideoProvider = 'youtube' | 'nba';
type CandidateVideoContentType = 'in-game-injury-event';
type CandidateCompetition =
  | 'nba-preseason'
  | 'nba-regular-season'
  | 'nba-play-in'
  | 'nba-playoffs'
  | 'nba-all-star';
type CandidateDiagnosisStatus = 'unconfirmed' | 'confirmed' | 'conflicted';
type FirstPartyAvailabilityStatus = 'available' | 'documented-unavailable' | 'not-applicable';
type CandidateDiscoveryStatus =
  | 'discovered'
  | 'needs-source'
  | 'source-ready'
  | 'source-verified'
  | 'excluded';
type DiagnosisSourceType = '' | 'diagnosis-first-party' | 'diagnosis-secondary';
type VideoUploaderProvenance =
  | 'league'
  | 'team'
  | 'broadcaster-rightsholder'
  | 'official-player'
  | 'unknown';
type ProvenanceCheckStatus = 'pending' | 'verified' | 'rejected';
```

Candidate IDs use:

```text
CAND-NBA-ACL-YYYY-NNN
CAND-NBA-ANKLE-YYYY-NNN
CAND-NBA-ACHILLES-YYYY-NNN
```

`YYYY` is the event year and `NNN` is a stable per-injury sequence. IDs are never renumbered after review; excluded rows remain for audit.

## Source acceptance rules

### Diagnosis

- A recent source-verified candidate requires at least one league, team, official injury report, official press release, or other first-party page that explicitly confirms the target injury category.
- A classic candidate uses the same first-party rule when available. A two-secondary-source exception is allowed only when `first_party_availability_status=documented-unavailable`, with non-empty factual basis, named checker/date and an exact candidate audit reference whose structured evidence lists official domains/pages searched, attempted canonical or archived URLs, observed HTTP/search outcome and check time. A bare assertion that the original is old or unavailable does not qualify.
- Two URLs from the same normalized `independence_group` are not independent. Syndicated copies sharing an `origin_report_id` are one source even when domains or publisher names differ.
- NBA injury reports support only what is written in the report. They do not establish grade, imaging, surgery, rehabilitation length, or return date when those details are absent.
- `diagnosis_claim` is a brief paraphrase of the externally confirmed category. It must not quote more than necessary and must not add a grade or prognosis.
- A conflict between credible sources sets `diagnosis_status=conflicted`, prevents `source-verified`, and sends the candidate to later resolution.

### Video

- The launch primary video must use `video_content_type=in-game-injury-event` and show the same athlete's injury event during the recorded NBA competition. Official interviews, news recaps, analysis packages, practice, warm-up, rehabilitation, return footage and compilations are excluded as primary videos; they cannot be rescued by official uploader provenance.
- The event source, video title/context and root audit must agree on athlete, event date, opponent and competition. This proves event identity only and never proves the medical diagnosis.
- Accepted uploaders are NBA/league, team, or recognizable broadcaster/rightsholder channels. `official-player` and `unknown` provenance cannot reach `provenance_check_status=verified` without separate documented authority.
- Canonical video URLs must be on the original platform page. Tracking parameters are removed.
- The researcher records channel URL, uploader, publication date, provenance, and a factual provenance basis such as `league official channel`, `team official channel`, or `broadcast rightsholder channel`.
- A manual browser check decides `embed_status`: privacy-enhanced player works, original-link-only, or unavailable. oEmbed success is not proof of embeddability or rights.
- `video_provider=youtube` is required for `embed_status=verified`. NBA.com uses `video_provider=nba` and can only be external-link-only or unavailable. A new broadcaster host requires an explicit source-policy provider-registry revision and test before use.
- The browser check records whether platform captions are available. `not-verified` cannot reach source-ready; `unavailable` is allowed for authoring but must remain visible to readers, who still receive the site's written summary. A later public build must degrade an unavailable-caption video to a clearly labeled original external link rather than embed it. No transcript is copied or stored.
- YouTube Data API status may corroborate title, uploader and `embeddable`, but an API result never proves copyright permission or regional availability.
- NBA.com availability does not itself grant reuse rights. NBA terms are reviewed again before any public plan.
- `provenance_check_status=verified` means uploader/rightsholder provenance passed this source policy; it is not a legal license or public-release authorization.

## Primary policy references

- NBA official injury reports: https://official.nba.com/nba-injury-report-2025-26-season/
- NBA terms of use: https://www.nba.com/termsofuse
- YouTube privacy-enhanced embedding: https://support.google.com/youtube/answer/171780
- YouTube Player parameters: https://developers.google.com/youtube/player_parameters
- YouTube IFrame API: https://developers.google.com/youtube/iframe_api_reference
- YouTube developer policies: https://developers.google.com/youtube/terms/developer-policies
- YouTube Videos API: https://developers.google.com/youtube/v3/docs/videos/list

### Task 0: Add strict research parsing and validation

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/research/candidate-contract.ts`
- Create: `src/lib/research/csv.ts`
- Create: `src/lib/research/validation.ts`
- Create: `scripts/research/check-candidates.ts`
- Create: `tests/fixtures/research/valid-candidates.csv`
- Create: `tests/fixtures/research/invalid-candidates.csv`
- Create: `tests/unit/research-candidates.test.ts`

- [ ] **Step 1: Write parser and validation failures first**

Tests cover:

1. exact header/order and RFC 4180 quoted commas/newlines;
2. missing, duplicate, or unknown columns;
3. BOM handling, blank rows, whitespace normalization, and duplicate candidate IDs;
4. candidate ID injury/year mismatch;
5. invalid dates, NBA season outside `^(19|20)[0-9]{2}-[0-9]{2}$`, eventDate/season mismatch, competition, URL scheme, enum, and boolean;
6. duplicate event key `(normalized athlete, eventDate, injuryCode)`;
7. duplicate canonical video URL assigned to different events;
8. classic status/date/reason mismatch;
9. recent diagnosis lacking first-party source;
10. classic secondary sources with the same publisher group, same syndicated origin report, missing second source, or missing/malformed structured first-party-unavailability evidence;
11. source-ready row with a content type other than `in-game-injury-event`, missing/mismatched event-video identity, pending provenance, unchecked/unavailable embed, unverified caption status, conflicted diagnosis, missing event/video/source title/date/access metadata, missing checker identity, or exclusion reason;
12. source-verified row that does not first pass source-ready rules or lacks named reviewer/date;
13. excluded row without reason and non-excluded row with an exclusion reason.

Run:

```bash
npm run test:unit -- tests/unit/research-candidates.test.ts
```

Expected: failure because research modules do not exist.

- [ ] **Step 2: Install one pinned CSV parser**

```bash
npm install --save-dev csv-parse@7.0.2
```

Review that only `package.json` and `package-lock.json` dependency sections changed.

- [ ] **Step 3: Implement deterministic validation**

Export:

```ts
parseCandidateCsv(text: string, expectedInjury: CandidateInjuryCode): CandidateRow[];
validateCandidateRow(row: CandidateRow): ValidationIssue[];
validateCandidateSet(rows: CandidateRow[]): ValidationIssue[];
```

The parser never executes spreadsheet formulas or HTML, never follows URLs, and never mutates source text. Validation errors include CSV filename, 1-based row, column, stable code, and message.

- [ ] **Step 4: Add package commands**

Add exactly:

```json
{
  "research:check": "tsx scripts/research/check-candidates.ts",
  "research:verify-links": "tsx scripts/research/verify-candidate-links.ts",
  "research:check-verification": "tsx scripts/research/check-candidate-verification.ts",
  "research:review-set-digest": "tsx scripts/research/digest-review-set.ts",
  "research:manifest": "tsx scripts/research/generate-candidate-manifest.ts",
  "research:check-manifest": "tsx scripts/research/check-candidate-manifest.ts",
  "research:digest": "tsx scripts/research/digest-candidate-manifest.ts",
  "research:registry:check": "tsx scripts/research/check-source-manifest-registry.ts"
}
```

Commands whose script is introduced later are not run until the corresponding task.

- [ ] **Step 5: Turn parser tests green and commit**

```bash
npm run test:unit -- tests/unit/research-candidates.test.ts
git add package.json package-lock.json src/lib/research tests/fixtures/research tests/unit/research-candidates.test.ts scripts/research/check-candidates.ts
git diff --cached --check
git commit -m "feat: validate NBA research candidates"
```

### Task 1: Freeze the NBA source policy before finding cases

**Files:**

- Create: `research/source-policy/nba.v1.md`
- Create: `research/source-policy/source-policy.v1.json`
- Create: `tests/unit/research-source-policy.test.ts`

- [ ] **Step 1: Write policy contract tests**

Require version `nba-v1`, cutoff `2016-08-06`, the controlled tokens above, current official reference URLs, diagnosis hierarchy, independent classic-source rule, the launch-only in-game injury-event content type and event-identity rule, uploader acceptance table, no-download/no-screenshot rule, click-to-load rule, and explicit statements that noindex is not privacy and technical embedding is not legal permission.

The canonical JSON policy and human decision table are immutable for version `nba-v1`: tests compute and expose the exact SHA-256 of both files, require the JSON's declared version to map one-to-one to those bytes, and reject same-version content drift. Any policy change requires a new policy version plus a complete verifier/review-set/decision/manifest cycle.

- [ ] **Step 2: Write the human-readable decision table**

At minimum:

| Condition | Candidate action |
|---|---|
| First-party diagnosis + accepted original uploader + verified embed | eligible for source review |
| First-party diagnosis + accepted uploader + embed disabled | eligible as external-link-only |
| Classic + two independent explicit secondary diagnoses + accepted video | eligible for classic exception review |
| Diagnosis based only on video/commentary | needs-source or excluded |
| Fan/compilation/repost uploader | excluded |
| Official recap/interview/practice/warm-up/rehab clip rather than the in-game injury event | excluded as primary video |
| Source conflict | conflicted; not source-verified |
| Video deleted but audit sources remain | unavailable; not counted in manifest |
| Search snippet only | not a source |

- [ ] **Step 3: Verify and commit policy**

```bash
npm run test:unit -- tests/unit/research-source-policy.test.ts
git add research/source-policy tests/unit/research-source-policy.test.ts
git diff --cached --check
git commit -m "docs: freeze NBA source policy"
```

### Task 2: Create the three candidate ledgers and perform parallel discovery

**Files:**

- Create: `research/candidates/acl.csv`
- Create: `research/candidates/ankle-sprain.csv`
- Create: `research/candidates/achilles-rupture.csv`
- Create: `research/reviews/acl-discovery-log.md`
- Create: `research/reviews/ankle-sprain-discovery-log.md`
- Create: `research/reviews/achilles-rupture-discovery-log.md`

- [ ] **Step 1: Create header-only files with `apply_patch`**

Each file starts with the exact CSV header from this plan. Run `npm run research:check`; expected result is a clear failure that each injury has zero candidates, proving the validator sees all files.

- [ ] **Step 2: Assign mutually exclusive injury paths**

- ACL researcher edits only `acl.csv` and `acl-discovery-log.md`.
- Ankle researcher edits only `ankle-sprain.csv` and `ankle-sprain-discovery-log.md`.
- Achilles researcher edits only `achilles-rupture.csv` and `achilles-rupture-discovery-log.md`.

Researchers do not modify shared scripts, policies, manifests, site content, or another injury file.

- [ ] **Step 3: Discover at least 15 plausible events per injury**

For each event:

1. open the event/context page and record canonical URL;
2. open diagnosis source page(s), classify first-party vs secondary, record publisher group/syndicated origin, and paraphrase only the confirmed category;
3. open the original video page and channel page, identify uploader provenance;
4. record competition, `video_content_type=in-game-injury-event`, video title and per-source published/access dates while pages are open; reject official interviews, recaps, analysis, practice/warm-up, rehabilitation and compilation footage as the primary video;
5. test privacy-enhanced embed manually without autoplay; if blocked, test the original external link;
6. check the original platform's caption control and record available/unavailable without storing transcript text;
7. record all check dates and retain failures/exclusions for audit;
8. avoid all medical mechanism/prognosis writing beyond the narrow external diagnosis claim.

Each discovery log records search families used, official domains checked, known source gaps, duplicate decisions, classic-candidate rationale, and a statement that no media was downloaded.

- [ ] **Step 4: Run per-injury validation during research**

After each batch:

```bash
npm run research:check
```

Expected during discovery: structural errors are zero; count/source gaps may remain explicitly reported until enough rows pass.

`research:check` treats `source-ready` and `source-verified` together for discovery-volume reporting. Only manifest validation counts `source-verified` rows.

- [ ] **Step 5: Agent handoff**

Each agent reports exact row counts by `discovery_status`, recent/classic split, every unresolved candidate ID, sources opened, no-download confirmation, and `git diff --check` result. Candidate rows that appear complete stop at `source-ready`; agents do not promote them to `source-verified` or commit.

### Task 3: Add low-concurrency live link and video metadata verification

**Files:**

- Create: `src/lib/research/link-verification.ts`
- Create: `scripts/research/verify-candidate-links.ts`
- Create: `scripts/research/check-candidate-verification.ts`
- Create: `research/verification/nba-source-verification.v1.json`
- Create: `tests/unit/research-link-verification.test.ts`

- [ ] **Step 1: Write mocked failures**

Cover redirect, 200, 404, 410, 429/retry, timeout, DNS error, content-type mismatch, canonical URL drift, YouTube API key absent, video not embeddable, private/deleted video, uploader/title mismatch, and stale result. Pure coverage tests also reject a URL changed after verification, a newly added accepted row, an extra artifact row for a now-excluded candidate, changed expected identity, duplicate/missing URL kind, root-audit mismatch, and artifact bytes changed after a bound decision. The same artifact passes immediately before and after an authorized source-ready → source-verified promotion because workflow reviewer/status fields are excluded from its accepted-set projection; a directly promoted source-verified row lacking the exact durable decision reviewer/date/digest fails. Unit tests never call the live web.

- [ ] **Step 2: Implement bounded verification**

Use concurrency `2`, maximum `3`; 15-second timeout; at most 3 attempts; deterministic user agent identifying the research verifier; only candidate HTTPS URLs; no page body storage. Output contains candidate ID, URL hash, checkedAt, final URL, status code, metadata comparison, and error classification.

If `YOUTUBE_API_KEY` is present, call official `videos.list` for `snippet,contentDetails,status`. Never print or serialize the key. Without a key, record `youtubeApiStatus='not-obtained'`; do not infer failure or embeddability from oEmbed.

The live verifier uses the same accepted set (`source-ready` or `source-verified`) and workflow-free URL projection described below. It may flag a manually verified row as stale/conflicted, but it may not automatically promote a row to source-verified or provenance-verified. It never edits a CSV or root-audit file: it computes a complete canonical artifact in a temp file, validates it, then atomically replaces only `research/verification/nba-source-verification.v1.json`.

`research:check-verification` is read-only. Its accepted set is every current `source-ready` or `source-verified` row; both statuses must pass identical source rules, and the URL-set projection excludes only workflow status/reviewer/date. It requires an exact bijection between every accepted URL+source kind+expected publisher/title/uploader/event identity and the canonical verification artifact, with no missing, duplicate, stale or extra candidate/URL result; it also requires each candidate's current strict root-audit reference/status to match. A `source-verified` row additionally requires the exact durable source-review decision reviewer/date/candidate-set digest and both current policy digests. It never updates `checkedAt`.

- [ ] **Step 3: Turn mocked tests green**

```bash
npm run test:unit -- tests/unit/research-link-verification.test.ts
```

Expected: exit `0` with no external request.

- [ ] **Step 4: Run the live verifier after browsing is complete**

```bash
npm run research:verify-links
```

This Task 3 run is a precheck, not the final freeze, because the root audit does not exist yet and may still correct CSV rows. Task 4 must rerun the live verifier after its last CSV/root-audit change, then run the read-only exact-bijection checker before computing the candidate-set digest. Any live-verifier rerun after a named decision changes `checkedAt`/artifact bytes, invalidates that decision, and requires the full final-freeze loop plus named content-owner review again.

Expected: exit `0` only when every URL attached to an accepted row is reachable or has an explicitly accepted external-link-only condition. Temporary failures remain distinguishable from confirmed removal.

- [ ] **Step 5: Commit the integrated discovery batch**

```bash
npm run research:check
git add research/candidates research/reviews research/verification src/lib/research/link-verification.ts scripts/research/verify-candidate-links.ts scripts/research/check-candidate-verification.ts tests/unit/research-link-verification.test.ts
git diff --cached --check
git commit -m "research: verify NBA injury candidates"
```

### Task 4: Root audit every proposed source-ready candidate

**Files:**

- Create: `research/reviews/2026-08-06-root-source-audit.md`
- Create: `research/reviews/root-source-audit.v1.json`
- Create after named approval: `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json`
- Create: `scripts/research/digest-review-set.ts`
- Modify: `research/verification/nba-source-verification.v1.json`
- Modify as needed: the three candidate CSV files

- [ ] **Step 1: Produce an exact audit queue**

```bash
npm run research:check
```

The checker prints each proposed source-ready candidate in stable injury/eventDate/candidateId order with its diagnosis/video/event URLs. Save the IDs and counts in the audit file.

- [ ] **Step 2: Open every source, not a sample**

For every proposed source-ready row, root verifies:

- athlete/event/date/team identity and duplicate status;
- the main video is the same in-game injury event for that athlete/date/opponent/competition, not a recap, interview, practice/warm-up, rehabilitation, return or compilation clip;
- target injury is explicitly confirmed by accepted source hierarchy;
- classic exception actually predates cutoff and has teaching-value reason;
- any classic secondary-source exception has structured evidence that the first-party original is not obtainable, rather than an undocumented assumption;
- source 1/source 2 have distinct publisher groups and syndicated origins where the classic exception uses them;
- uploader/channel is the original accepted provenance source;
- canonical link, embed/external behavior, title and uploader still match;
- no unsupported grade, surgery, prognosis, mechanism or RTP inference entered the CSV.

Record pass/fail, checkedAt and reason per candidate ID in both the human-readable review and strict `root-source-audit.v1.json`. Each strict candidate object contains `candidateId`, event/video/diagnosis pass flags and `firstPartyAvailability`. That nested object has controlled `status`, nullable factual `basis`, `checkedBy`, `checkedAt`, non-empty `officialLocationsChecked[]` (`url`, `outcome`, `observedAt`), and `archiveOrSearchChecks[]` (`queryOrUrl`, `outcome`, `observedAt`). For a secondary-source classic exception it must be `documented-unavailable`, all identity/time/evidence lists must be complete, and the CSV `first_party_availability_audit_ref` must equal its exact JSON Pointer. When a first-party diagnosis is present, status is `available`; `not-applicable` is permitted only for excluded/unconfirmed rows. Failed rows become `needs-source` or `excluded`; do not delete them.

- [ ] **Step 3: Resolve quality before quantity**

Run validation again. If any injury has fewer than 10 passing candidates, return to discovery. Do not include a weak 10th case. If no classic case anywhere passes, record the exact missing source/video condition and keep G2 closed; a per-injury classic gap is reported but does not independently close G2.

- [ ] **Step 4: Freeze the exact final verification/review set and pause for named content-owner review**

After every root-audit correction and CSV status/source/URL change is complete, run the final freeze loop in this exact order:

```bash
npm run research:verify-links
npm run research:check-verification
npm run research:check
npm run research:review-set-digest
```

The pure verification checker must prove exact accepted-set URL/kind/expected-identity coverage plus matching root-audit references before the digest command runs. `research:review-set-digest` uses the same accepted set as the checker: every `source-ready` or `source-verified` row. It generates the candidate-set digest from that set, strict root audit, exact live-verification artifact, and exact bytes/SHA-256 of both `research/source-policy/source-policy.v1.json` and `research/source-policy/nba.v1.md`. Its row projection includes all candidate/source/video/diagnosis/policy facts but excludes `discovery_status`, `reviewed_by`, and `reviewed_at`; at initial decision time all accepted rows are source-ready, and the later authorized promotion preserves the same IDs/projection/digest when they become source-verified.

Expected: one 64-character lowercase SHA-256. Present that digest and the full audit queue to the content owner. The content owner supplies an exact identity and approval decision; it may be the user or another named responsible person, but an agent cannot invent it. If any bound CSV, root-audit, source-policy, verification artifact or decision input changes afterward, the decision is stale and execution returns to the start of this final freeze loop; no partial recheck is permitted.

After explicit approval, use `apply_patch` to create `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json` with only `schemaVersion: 1`, `manifestId: 'NBA-SOURCE-2026-08-06-001'`, `status: 'approved-for-manifest'`, exact `sourcePolicyJsonDigest`, exact `sourcePolicyMarkdownDigest`, the exact `reviewedBy`, UTC `reviewedAt`, `candidateSetDigest`, and sorted unique `classicProposalCandidateIds`. The named content owner must explicitly confirm that this list is the set of classic candidates they propose for medical-review consideration; it must exactly equal the classic IDs in the accepted set (all source-ready at initial decision time, then the same IDs after authorized promotion). The validator rejects the decision if any bound candidate/source/audit/verification/policy input, manifest ID, or proposed-classic membership changes.

- [ ] **Step 5: Apply the human source-review decision**

The named content owner reviews the audit queue and original pages, then the executor copies the durable decision identity/date into each accepted CSV row and promotes it from `source-ready` to `source-verified` using `apply_patch`. This confirms source curation only; it does not fill medical reviewer fields in case content.

```bash
npm run research:check
git add research/candidates research/verification/nba-source-verification.v1.json research/reviews/2026-08-06-root-source-audit.md research/reviews/root-source-audit.v1.json research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json scripts/research/digest-review-set.ts
git diff --cached --check
git commit -m "research: record candidate source review"
```

### Task 5: Generate and validate the canonical authoring manifest

**Files:**

- Create: `src/lib/research/candidate-manifest.ts`
- Create: `scripts/research/generate-candidate-manifest.ts`
- Create: `scripts/research/check-candidate-manifest.ts`
- Create: `scripts/research/digest-candidate-manifest.ts`
- Create: `scripts/research/check-source-manifest-registry.ts`
- Create: `research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json`
- Modify append-only: `research/source-manifest-registry.v1.json`
- Modify: `.gitignore`
- Create: `tests/unit/research-manifest.test.ts`

- [ ] **Step 1: Write manifest failures first**

Tests require:

- schemaVersion `1`, manifestId `NBA-SOURCE-2026-08-06-001`, batchType `launch`, period `2026-08-06`, sourcePolicyVersion `nba-v1`, cutoff `2016-08-06`;
- exact SHA-256 for all three source CSV byte streams, link-verification artifact, strict root-audit artifact, canonical JSON policy, human policy table, and durable source-review decision;
- every accepted-row reviewer identity/date equals the durable source-review decision; its candidate-set digest still matches current inputs;
- every classic manifest entry is listed in the decision's `classicProposalCandidateIds` and receives `classicProposedBy` plus the source-review-decision digest from that named decision; a secondary-source exception carries a resolvable structured `documented-unavailable` first-party evidence object from the frozen root audit; non-classic entries use `classicReason=null` and `classicProposedBy=null`;
- only source-verified entries included;
- because this is a launch batch: at least 10 per injury, at least 30 total, recent > classic across the manifest, and at least one classic overall; generic contract fixtures also prove a quarterly batch may contain fewer cases or zero additions while a correction batch requires exact supersedes and does not inherit launch count gates;
- unique candidate ID/event/video URL;
- every entry has competition/season consistency, `videoContentType='in-game-injury-event'`, explicit event/video identity match, confirmed diagnosis, complete source publication/access metadata, accepted video provider/provenance, captions checked, provenance verified, embed verified or external-link-only, reachable verification, and root audit pass;
- no medical review or indexing-authorization fields exist in the manifest.
- identical input bytes generate a byte-identical manifest and digest on repeated runs;
- registry validation rejects duplicate/unknown keys, ID/path/digest reuse, noncanonical order, changed prior entries, path traversal, multiply superseded references, corrections without one matching replacement per reference, and invalid supersedes; append validation starts from exact trusted canonical bytes/digest, preserves the complete prior prefix, and adds exactly one terminal registry entry. Loaded active entries are globally unique by candidate ID, event identity and canonical video URL, so a later quarterly batch cannot duplicate this launch corpus;
- fault-injection tests interrupt immediately before manifest publication, after exclusive manifest publication but before registry replacement, and after registry replacement. Retry from the middle state adopts only a byte-identical orphan whose recomputed input/decision/manifest digest matches while the exact old registry bytes are unchanged; retry after completion is read-only/idempotent. A partial/mutated orphan, changed inputs/decision, registry drift/collision, already registered digest mismatch, or second writer always fails without rewriting either authority file;
- concurrency tests place two writers at a barrier and prove exactly one can acquire the bounded registry transaction lock; the loser exits before reading/publishing authority bytes. Crash tests prove a retained lock is never auto-stolen or auto-deleted, and injected durability spies require file plus parent-directory fsync after exclusive manifest publication, registry rename, and final lock removal.

Also test digest mismatch, count shortfall, stale verification, and a synthetic valid manifest.

- [ ] **Step 2: Define the manifest shape**

Top-level keys only:

```text
schemaVersion, manifestId, batchType, period, sourcePolicyVersion, cutoffDate,
generatedAt, sourceReview, sourceDigests, counts, supersedes, entries
```

`manifestId`, `batchType` and `period` are the exact launch values declared by this plan. `supersedes` is exactly `[]`. `sourceDigests` has explicit named digests for all three CSVs, verification artifact, strict root audit, canonical JSON policy, human policy table, and durable decision. `sourceReview.status` is exactly `approved-for-authoring`; `sourceReview.manifestId`, both policy digests, `sourceReview.reviewedBy`, `sourceReview.reviewedAt`, and `classicProposalCandidateIds` are copied from the immutable batch decision. The generator rejects blank, mixed, agent-invented, digest-stale, policy-version/content-stale, manifest-ID-stale, or classic-membership-stale decisions.

`generatedAt` is deterministic: the latest timestamp already present in the accepted CSV reviews, live-verification artifact, or strict root-audit artifact. It is never the generator wall-clock time, so unchanged inputs produce unchanged bytes.

Each entry stores `entryDigest`, computed over its canonical entry payload with only that digest field omitted; `supersedes: null` for this launch batch; candidate identity/event/competition fields; `videoContentType='in-game-injury-event'` plus the strict root-audit event-binding reference/status/basis; video title/provider/caption/provenance metadata; diagnosis claim; both diagnosis source records including `independenceGroup`, `originReportId`, publisher, URL, published/access dates; event source with published/access dates; structured first-party availability evidence/reference; classic reason and decision-derived `classicProposedBy`; source-review-decision digest/identity/date; and live/root verification references. It intentionally contains no general summary, professional analysis, mechanism claim, prognosis, RTP advice, medical approval, public-rights clearance, or public status. Future correction entries instead carry an exact prior `manifestId`/`candidateId`/`entryDigest` reference that also appears in the batch-level `supersedes` list.

- [ ] **Step 3: Generate canonical JSON**

The generator first acquires the exact bounded transaction lock `research/.source-batch-registry.lock` with same-filesystem exclusive `open(..., 'wx')`; a second writer or any pre-existing lock fails before reading or publishing authority bytes. While holding that lock, it rereads the three validated CSV files, strict root-audit artifact, link-verification artifact, both exact source-policy files, immutable batch decision, and exact registry bytes; validates the one-to-one policy version/content digests; normalizes strings to NFC; sorts entries by injury, eventDate, candidateId; derives the deterministic timestamp above; and computes the complete canonical manifest plus next-registry bytes in memory. All idempotent-completion and orphan-adoption checks also happen inside this lock from freshly reread bytes.

It validates both objects/digests first, writes and fsyncs temporary files under ignored `research/.source-batch-tmp/`, then publishes the manifest with a same-filesystem exclusive no-clobber operation and fsyncs the manifest parent directory. It again requires the locked registry bytes/digest to equal the trusted prior state, fsyncs the next-registry temp, atomically renames it over the registry, and fsyncs the registry parent directory before final full revalidation. Only after success does it remove the exact held lock and fsync its parent directory. It never overwrites a manifest or decision.

The appended registry entry uses the exact fields defined by `SourceManifestRegistryV1`: fixed manifest ID/path, manifest digest, fixed decision path/digest, source policy `nba-v1`, `batchType=launch`, `period=2026-08-06`, deterministic `createdAt=manifest.generatedAt`, `previousRegistryBytesDigest` equal to the SHA-256 of the exact canonical empty registry bytes, and `supersedes=[]`. If a crash leaves the final manifest unregistered, retry may adopt it only when its exact bytes equal the freshly recomputed expected manifest, the decision/input digests are unchanged, the registry remains the exact expected prior bytes, and no ID/path/digest/active-identity collision exists; it then performs only the validated registry append. If the batch is already registered, an exact full revalidation exits successfully without writing; every mismatch fails closed. Temporary files are never authority or staged. `research:registry:check` reloads every registered artifact, recomputes all digests and validates the append-only structure.

Append exactly `research/.source-batch-tmp/` and `research/.source-batch-registry.lock` to `.gitignore`; the generator refuses a temp path outside that bounded directory and cleans only files whose generated transaction identity matches this batch. A leftover temp file is never adopted as a manifest and never enters a digest or commit. A crash-retained lock is never automatically stolen, removed or age-guessed: a human operator must first establish that no writer process remains, record the lock-file SHA-256, inspect the manifest/registry state with the read-only checker, and then explicitly remove only that exact lock before rerunning the idempotent recovery path.

```bash
npm run test:unit -- tests/unit/research-manifest.test.ts
npm run research:manifest
npm run research:check-manifest
npm run research:registry:check
npm run research:digest
```

Expected: all exit `0`; digest command prints exactly one 64-character lowercase SHA-256 and no secret.

- [ ] **Step 4: Verify G2 counts and non-medical state**

```bash
node -e 'const m=require("./research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json"); console.log(m.counts); if (JSON.stringify(m).match(/medicalReview|allowIndexing|indexingAuthorization/)) process.exit(1)'
```

Expected: counts show each injury at least 10 and total at least 30; command exits `0`.

- [ ] **Step 5: Commit the manifest and handoff evidence**

```bash
git add .gitignore src/lib/research/candidate-manifest.ts scripts/research/generate-candidate-manifest.ts scripts/research/check-candidate-manifest.ts scripts/research/digest-candidate-manifest.ts scripts/research/check-source-manifest-registry.ts research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json research/source-manifest-registry.v1.json tests/unit/research-manifest.test.ts
git diff --cached --check
git commit -m "research: freeze NBA authoring manifest"
git status --short
```

Expected: clean local branch; no remote/push/deploy.

### Task 6: Handoff to a new exact case-authoring plan

**Files:**

- Create: `docs/reviews/nba-source-discovery-handoff.md`
- Do not yet create: `src/content/cases/*.json`

- [ ] **Step 1: Record durable evidence**

Handoff includes manifest ID/digest/path, immutable source-review decision path/digest, post-append registry digest and trusted previous-registry-bytes digest, exact counts by injury/recent/classic/embed status, candidate IDs excluded and why, URLs requiring future recheck, source reviewer identity, live-verification date, no-download confirmation, exact tests, Git branch/commit, and explicit statement that medical review/public release remain unauthorized.

- [ ] **Step 2: Run the full bounded gate**

```bash
npm ci
npm run research:check
npm run research:check-verification
npm run research:check-manifest
npm run research:registry:check
npm run research:digest
npm run verify
```

Expected: all exit `0`; `npm run verify` re-runs formatting, Astro/content checks, unit coverage, review build, browser/axe tests, Lighthouse budgets, and artifact verification after all research code changes.

Run public release separately:

```bash
set +e
npm run release:public
public_release_exit=$?
set -e
test "$public_release_exit" -ne 0
```

Expected: final `test` exit `0`; source discovery alone does not make public release eligible.

- [ ] **Step 3: Invoke writing-plans for real case paths**

Create the later date-stamped `nba-injury-case-authoring` implementation plan inside the atlas repository's `docs/superpowers/plans/` from manifest `NBA-SOURCE-2026-08-06-001`, resolved through the validated registry. It must bind the manifest ID/path/digest, registry entry and decision digest; declare role `nba-injury-case-authoring`, execution scope ID `nba-medical-content-authoring-only`, and required closed scope IDs `private-hosting`, `public-release`, `deployment`; enumerate every real candidate ID, final case slug/path, exact source records, all three injury-overview paths/evidence tasks, baseline update, review-set generation, authoring/review tasks and tests. Do not start case JSON or medical overview authoring in this plan.

- [ ] **Step 4: Commit the durable handoff and follow-on plan**

Bind the new plan as `executionAuthorization.status='not-authorized'` before staging it. The binding tool must reject a missing file, duplicate entry, non-SHA hash, or an attempt to mark it authorized without a bound user decision.

```bash
ATLAS_AUTHORING_PLAN="docs/superpowers/plans/$(date +%F)-nba-injury-case-authoring.md"
test -f "$ATLAS_AUTHORING_PLAN"
npm run plan:bind -- "$ATLAS_AUTHORING_PLAN" --role nba-injury-case-authoring --scope nba-medical-content-authoring-only --closed-scopes private-hosting,public-release,deployment --status not-authorized
npm run plan:verify
git add docs/reviews/nba-source-discovery-handoff.md docs/superpowers/plans docs/decisions/plan-binding.v1.json
git diff --cached --check
git commit -m "docs: plan NBA case authoring"
git status --short
```

Expected: clean local branch; the handoff and actual date-stamped plan are versioned and hash-bound but remain explicitly unauthorized. Case authoring starts only after a later user decision is bound. No remote, push or deployment occurred.

## Discovery completion criteria

- Each injury ledger contains at least 15 researched candidates and retains exclusions for audit.
- The immutable launch manifest contains at least 10 source-verified entries per injury and at least 30 total; recent cases outnumber classic cases and at least one qualified classic is present. Future quarterly batches may be smaller or empty, and correction batches use exact supersedes; site-level selectors continue enforcing the approved corpus floor.
- Every included diagnosis and video has source hierarchy, provenance, dates, manual check, live-verification result, root audit, and named content-owner review.
- The manifest clearly means approved for authoring, not medically approved or publicly licensed.
- No media or article bodies are stored; no diagnosis comes from video observation alone.
- No case content, medical-review approval, hosting, deploy, remote, push, DNS, analytics, or indexing change occurred.

## Future quarterly and correction editions

Every three-month refresh begins with a new date-stamped, separately authorized source-discovery plan and unique `NBA-SOURCE-YYYY-MM-DD-NNN` batch. A quarterly manifest records only new passing cases discovered for that period and may contain zero or uneven injury counts; its active candidate/event/video identities must not duplicate any prior batch, and appending that unreferenced batch does not alter prior manifest, case, clinical or review-set digests. A factual correction uses `batchType=correction`, gives each prior entry at most one exact `supersedes` reference and exactly one matching replacement entry, and immediately removes that origin from the current active set. The affected case must be rebound and medically re-reviewed or moved to a matching retired/unavailable update before another approved/public build; immutable historical releases remain valid. Old manifest/decision bytes and the existing registry prefix remain immutable.
