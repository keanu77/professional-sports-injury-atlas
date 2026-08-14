# Decision 17 Case Filter and Follow-up Notes Plan

> Status: NOT AUTHORIZED. The owner's 2026-08-14 instruction authorizes only
> this plan-drafting and `not-authorized` registration cycle. Repository
> execution requires a later owner-supplied strict `PlanExecutionDecisionV1`
> bound to this plan's exact final path and SHA-256. This cycle may add this
> plan, append its `not-authorized` plan-binding entry, and make one local
> registration commit. It may not create or bind an authorization JSON,
> execute Task 0 or any phase, research or draft any player follow-up fact,
> create `nba-v10`, change a schema, contract, test, page, component, script,
> case record, cover, registry, review artifact, receipt, service, or `dist`,
> or mutate a closed scope.

**Goal:** Add a tenth case-filter dimension for video source; simplify the
reader/professional layered-note presentation while retaining the reader
safety guard; expand the existing confirmed update into item-level,
source-attributed third-party follow-up drafts covering treatment, surgery,
injection, and actual return; and make the review identity/digest block
collapsed by default without removing its DOM content or changing either
existing digest calculation. Preserve all 21 current cover files byte-for-byte,
the CC BY-SA composition firewall, every clinical statement outside the
owner-named B-1/B-2 changes, and the private/noindex release boundary.

**Architecture:** Derive one controlled video-source token from the existing
provider, embed status, host, and NBA link-presentation facts, then place only
that token—not a source URL—in each minimal case-index shard. Keep the two
layered-note sections in the DOM, narrow the reader layer to “畫面不能證明什麼”,
and move follow-up reporting into its own structured block. Keep all 26
`src/content/cases/*.json` v1 records byte-identical so each case's already
approved clinical-core digest and named owner-review metadata remain exact;
store new material in strict `src/content/follow-ups/<case-slug>.json`
sidecars, bound to the case ID and unchanged clinical digest, under a separate
additive digest and `pending-owner-signoff` state. Govern the broadened source
hierarchy through an append-only `nba-v10` follow-up annex that inherits all
v9 video, photo, attribution, and CC BY-SA controls. Use native
`<details><summary>` for the review digest disclosure, leaving the existing
record/content/rendered-set values and calculations intact.

**Tech stack:** Node.js 24.14.0 selected from the required mise installation,
TypeScript, Astro 7, strict Zod contracts, canonical JSON, SHA-256, Vitest,
Playwright/axe, Lighthouse, local Git, the existing source-policy and
review/private-artifact tooling, launchd, and the already configured private
Tailscale review service.

## Scope and authority

- Execution role: `decision-17-case-filter-and-followup-notes`; execution scope ID: `decision-17-case-filter-and-followup-notes-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- Decision 17 fixes the intended result but is not execution authority. The
  owner will separately supply the strict authorization JSON. An agent must
  not draft, infer, backfill, or bind it.
- `medical-content-authoring` is deliberately absent from the closed-scope
  list. This is an intentional scope expansion after Decisions 13–16 kept it
  closed: B-2 requires Codex to produce new, sourced drafts about reported
  treatment, surgery, injection, and actual return. It is the first scope
  expansion in this Decision series for that complete follow-up category; it
  is not authority for unrelated diagnosis, prognosis, rehabilitation,
  teaching, overview, quarterly-update, or prescriptive content.
- `medical-review-decision` remains closed. Codex may collect sources, assign
  reporting tiers under the new policy, draft atomic follow-up statements,
  compute a draft digest, and mark them `pending-owner-signoff`. It may not
  place the owner's name or qualification in a new review field, change a
  pending item to approved/rejected, generate or apply a medical-review
  decision, or claim medical correctness. Physician signoff in the editor is
  a later owner action under separate exact authority.
- The 26 cases already carry named approval by 吳易澄醫師 over their current
  clinical-core digests. That approval lineage must remain exact and
  independently verifiable. A new pending follow-up draft must never make an
  old digest appear to approve new text, and Codex must not erase or overwrite
  the historical reviewer, qualification, timestamp, or approved digest.
- Only after exact authorization, permitted repository mutations are bounded
  to an append-only `nba-v10` policy pair and checker, the minimum additive
  follow-up sidecar schema/digest and review-set-v2 contract, 26 bounded
  follow-up research ledgers and pending sidecars, the video-source filter
  projection/UI, the B-1 layered-note presentation cleanup, the C native
  disclosure, aligned tests and review evidence, the ordered review artifact
  chain, and conventional local commits. The 26 case v1 records and their
  existing `sources` arrays are protected inputs, not permitted mutation
  targets.
- The owner's artifact reload instruction is exactly one final
  `launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1`
  after the new private manifest is committed. This does not authorize a
  launchd definition/load-state, listener, credential, port, Tailscale,
  hosting configuration, or other service mutation. If Task 0 governance
  classifies even this exact reload as the closed
  `hosting-service-mutation` scope, stop for corrected authority.
- Deployment, indexing, public release, external-account mutation,
  hosting-service mutation beyond that enumerated reload, remote-repository
  mutation, push, and every medical-review decision stay closed through all
  phases and rollback. `allowIndexing=false` and all private/noindex controls
  remain mandatory.

## Owner medical-risk disposition and required mitigation

The owner has expressly accepted a broader source posture after being told
that public statements about people the physician has not personally examined
increase the identified 《醫師法》§25④ exposure. This plan records that owner
choice; it does not convert the reporting into the site's diagnosis or remove
the need for medical signoff.

Every rendered follow-up block must visibly state:

> 以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。

Attribution is both block-level and item-level. Each atomic item names what
the identified third party reported and carries its own source target and
source publication date. A non-NBA HTTPS target renders as an ordinary
external source link. An `nba.com` target still satisfies item-level source
identity by displaying its full URL as non-navigable text; it must never
become an anchor, redirect, iframe, metadata target, JSON-LD URL, or script
sink.

## Video-source taxonomy frozen from the 26 records

The tenth filter dimension uses exactly these controlled values and visible
labels:

| Token                     | Visible label                 | Derivation precedence                                      | Planning count |
| ------------------------- | ----------------------------- | ---------------------------------------------------------- | -------------- |
| `youtube-embed`           | 站內 YouTube 嵌入             | `provider=youtube` and `embedStatus=verified`               | 7              |
| `nba-plain-text-citation` | NBA 官網純文字引註            | canonical host is `nba.com` or a subdomain; checked first   | 18             |
| `external-link`           | 外部連結                      | accepted non-NBA source with `embedStatus=external-link-only` | 1            |

The seven `youtube-embed` cases are Anfernee Simons 2023, Jayson Tatum 2025,
Kevin Durant Achilles 2019, Kyrie Irving ankle 2021, LaMelo Ball 2023,
LaMelo Ball 2025, and Tyrese Haliburton 2025. Two currently have unavailable
captions and may still degrade in a public build under the unchanged
accessibility rule; this filter describes their governed review-mode embed
status, not a promise to embed in every build mode.

The 18 `nba-plain-text-citation` cases are Anthony Edwards 2025, Brandon
Clarke 2023, CJ McCollum 2020, Damian Lillard 2025, Danny Green 2022,
Dejounte Murray 2025, Dwight Powell 2020, Ja Morant 2020, Joe Ingles 2022,
Kevin Durant ankle 2024, Kyrie Irving ACL 2025, LaMelo Ball 2022, LeBron
James 2021, Markelle Fultz 2021, Moritz Wagner 2024, Ricky Rubio 2021,
Thomas Bryant 2021, and Trae Young 2021. The sole `external-link` case is
Anthony Edwards 2023. An unexpected provider/host/status combination fails
closed instead of being silently placed in one of these buckets.

## Follow-up source hierarchy and atomic record contract

`nba-v10` must define at least these exact source-tier tokens and visible
labels:

| Token                      | Visible label             | Classification rule |
| -------------------------- | ------------------------- | ------------------- |
| `team-or-league-official`  | 球隊／聯盟官方公告        | A directly controlled team or league release/report; the domain alone is not enough without publisher identity. |
| `mainstream-media-report`  | 主流媒體報導              | A named mainstream outlet article, or an identifiable affiliated reporter's article/post with preserved account and publisher facts. |
| `unverified-report`        | 未證實報導                | Another report, social post, anonymous claim, or claim not independently confirmed; it must never be visually promoted to confirmed. |

Create exactly one strict sidecar at
`src/content/follow-ups/<case-slug>.json` for each corresponding case file.
Each sidecar has schema version `case-follow-up.v1`, the exact case ID, the
unchanged `computeCaseContentDigest()` value, an `nba-v10` policy binding, a
`legacyDiagnosisProjection`, and four explicitly present category arrays.
The projection may reference only the existing `general.confirmedUpdate`
field and exactly one existing case `sources[].id` whose `supports` contains
that field. It adds a governed source-tier token for display but never copies,
rewrites, or re-approves the diagnosis or source record. Its UI row must show
the tier label and the existing source's own title, publisher, publication
date, and NBA-safe presentation as visibly as every new item.

Each new atomic item requires a stable item ID, one controlled fact kind
(`treatment`, `surgery`, `injection`, or `actual-return`), a short factual
third-party-attributed paraphrase, fact date when the source supports one,
the reporting-tier token, source title, publisher/account, full canonical
HTTPS URL, source publication date, access date, medium, `nba-v10` policy
binding, and an independent draft-review binding. Define the item's payload
as all those content/source fields excluding review metadata; hash its
canonical bytes as `itemPayloadDigest`. The review binding is exactly
`{ status: "pending-owner-signoff", reviewedPayloadDigest: <that digest> }`
and contains no reviewer identity, review time, decision path, approval
digest, or free-form medical text.

The already approved `general.confirmedUpdate` diagnosis is projected into
the new display with that visible tier and its own existing compatible source;
its historical approval remains bound to the unchanged clinical-core digest.
New items are additive and separately pending. A paragraph-level citation,
one shared source list for several facts, a search-result snippet, a source
without a publication date, or a claim assembled by inference from multiple
incomplete reports fails the contract.

Each category uses an empty array when no qualifying fact is found. The UI
must render a clear category-level empty state such as “查無符合本政策且可逐條
引用的紀錄；未據此推定未曾發生。” Empty does not mean none occurred, and no
placeholder, likely treatment, typical operation, estimated date, or model-
generated completion is permitted.

An `actual-return` item is strictly retrospective. It requires an official
game/participation record or a contemporaneous mainstream report that records
actual participation/return and a supported occurrence date that is not in
the future; `unverified-report` cannot support this fact kind. The schema and
copy must not contain expected, projected, target, recommended, or estimated
return fields. The professional statement that treatment and return are
individualized and “不是套用固定回場日期” stays unchanged: it is general
clinical guidance, while the new item is only an already occurred historical
fact about this case. The block must expressly say that an actual-return
record is not a treatment duration, forecast, recommendation, or reusable
timetable.

## Why an append-only `nba-v10` is required

The immutable `nba-v9` pair still inherits the `nba-v2` clinical/video
policy. That policy limits the original diagnosis claim, forbids adding an
unstated surgery, rehabilitation length, prognosis, or return date, and does
not define treatment/injection/actual-return items or the owner's newly
accepted mainstream/reporter/unverified hierarchy. B-2 is therefore a
substantive source-acceptance and attribution change, not a presentation-only
edit.

Do not edit `nba-v2` or `nba-v9` in place. Add a full append-only `nba-v10`
successor that binds exact v9 bytes, inherits all source-page, video,
provider, privacy, media-handling, player-photo, attribution, non-clearance,
and CC BY-SA composition controls, and adds a follow-up-reporting annex. It
must explicitly and narrowly supersede only v9's inherited closure of
`medical-content-authoring` for the exact pending-authoring work in this plan;
all other inherited scope boundaries and compatible controls remain closed or
unchanged.
Use a separate `CURRENT_FOLLOWUP_SOURCE_POLICY_VERSION` binding for new items;
do not change the global current video/source-manifest policy from `nba-v2`,
which would incorrectly stale all 26 existing source bindings and video
provenance reviews.

`nba-v10` defines the source-classification and pending-draft contract; it
does not create execution authorization or approve any medical statement.
Its machine-readable execution boundary must set
`createsExecutionAuthorization=false`, name only the exact Decision 17
follow-up scope, and repeat the seven closed scope IDs from this plan. The
later owner-supplied strict Decision 17 authorization is the sole execution
authority. Source research under v10 may produce only `source-ready` evidence
and `pending-owner-signoff` drafts; Codex cannot promote any source or item to
source-reviewed, medically approved, or public. Tests must prove that source
selection for the 26 original cases, the v1–v9 historical bytes, photo
eligibility, the registry, video presentation, and every BY-SA
composition-path rejection remain unchanged.

## Approval and digest lineage

- Keep `computeCaseContentDigest()` and its existing clinical-core payload
  calculation unchanged. For every case, the current
  `review.reviewedContentDigest` must continue to equal that digest, and the
  current owner identity, qualification, and review timestamp remain exact.
- Add a separate deterministic `computeFollowUpDraftDigest()` over the
  canonical `case-follow-up.v1` sidecar: its case/core bindings, legacy
  diagnosis source-tier projection, ordered structured item payloads,
  item-level source facts, policy binding, and pending review bindings. Do not
  store the aggregate digest inside the sidecar or include a self-referential
  field; compute it for review/render artifacts. It cannot be substituted for
  the clinical-core digest or written into the existing approval field.
- Advance the review-set contract append-only to exact path
  `review/review-set.v2.json` with `schemaVersion=2`. Per case, v2 binds the
  unchanged approved clinical-core digest/identity and current follow-up
  sidecar/draft digest/state as distinct fields. Its content-authority
  snapshot also binds the later strict Decision 17 authorization path,
  digest, role, execution scope, and intentional opening of
  `medical-content-authoring`; this records authoring authority, not physician
  signoff. Retain `review/review-set.v1.json` byte-for-byte as historical
  evidence.
- Migrate the active contract deliberately: `review-set:generate` writes only
  the v2 governed file; `/review/review-set.json` serves its exact canonical
  bytes; review build, artifact manifest, private server/verifier, receipt,
  release gate, and their fixtures resolve v2. No fallback to v1 is allowed
  once follow-up sidecars exist. The existing
  `medical-review-decision.v1` parser/application must fail closed on a v2
  review set containing pending follow-ups; designing or applying its
  successor is outside Decision 17.
- The review UI visibly distinguishes “既有 owner 核准內容” from “新增後續消息：
  待醫師簽核”. Pending items are review-build content only and must be omitted
  or rejected by any public projection until a separately authorized owner
  decision binds the exact follow-up digest.
- Do not change the v1 decision schema or make it accept pending v2 content,
  and do not modify any existing owner decision. A future
  medical-review-decision version and editor signing cycle are outside
  Decision 17; only the minimum fail-closed version dispatch needed to reject
  v2 is permitted.
- C does not repurpose either visible digest. The existing case-content digest
  and rendered-set digest use the same functions and remain copyable. The new
  follow-up draft digest may be shown as an additional, explicitly pending
  value inside the same collapsed review disclosure.

## Non-goals

- No authorization JSON or authorization binding in this planning cycle. No
  Task 0, Phase 0–5 command, web research, policy generation, content draft,
  build, private request, reload, or service action now.
- No prediction, diagnosis from video, individualized treatment advice,
  prognosis, rehabilitation program, typical-timeline substitution, or
  inference that a missing report proves an event did or did not occur.
- No owner-signature simulation, reviewer-name reuse, digest rebaking,
  medical approval/rejection, medical-review decision, or public promotion of
  pending follow-up content.
- No byte change to any of the 26 case v1 records, including any diagnosis,
  professional note, existing source, video observation, review identity, or
  case identity; no change to any injury overview or quarterly update. B-1 is
  presentation-only and does not authorize rewriting underlying approved
  strings merely because they cease rendering. B-2 data lives only in the
  new sidecars and their governed research/review projections.
- No change to any of the 21 current cover files, player-photo registry v1–v8,
  focal point, credit, notice, source/provenance fact, license, or current
  selection. Not one cover byte may change.
- No weakening, deletion, bypass, or test-only exclusion of the CC BY-SA
  composition firewall. No new OG image, social image, case-card composition,
  infographic, or other baked derivative use is introduced.
- No NBA anchor, redirect, iframe, JSON-LD URL, metadata target, script target,
  or client-side reconstruction. NBA URLs remain literal audit text only.
- No edit to the algorithms behind the existing case-content digest or
  rendered-set digest, and no removal of record ID or digest inputs from the
  DOM. C changes default disclosure state only.
- No publication, deployment, indexing, DNS, Cloudflare, credentials,
  listener, port, launchd definition/load state, Tailscale configuration,
  external account, remote repository, push, or public release.
- No D16 private-verifier repair is silently absorbed into D17. A verifier
  failure stops D17 and requires its own authority if correcting it would
  exceed the bounded files and behavior named here.

## Frozen planning baseline

- Planning began from clean `main` commit
  `7a47b115dd1196515f75420a1b32deb8adc0d157`. An authorized executor records
  the later clean starting commit and stops on unexplained relevant drift.
- Every Node/npm command must prepend
  `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin` to `PATH` and
  prove `node --version` is exactly `v24.14.0`.
- There are exactly 26 case files. Their existing video facts reproduce the
  frozen 7/18/1 classification above: 7 YouTube verified embeds, 18 NBA
  pure-text citations, and one non-NBA external link.
- All 26 cases are `status=approved`, all 26 review objects are approved by
  `吳易澄醫師`, and each existing reviewed-content digest matches the current
  clinical-core calculation. The 30-file clinical freeze (26 cases, three
  injury overviews, one quarterly update) has historical aggregate SHA-256
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
  B-2 must not change those 30 files: all 26 case bytes, their clinical-core
  projections, and the full 30-file aggregate remain byte-identical. New
  follow-up sidecars are an independent protected content class.
- Current player-photo registry v8 has SHA-256
  `908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a`,
  selects 21 local covers for 21 athletes/26 cases, and its ordered current
  asset path/SHA ledger has aggregate SHA-256
  `625b47f92ad0e4706872e92ea7c7fd92e25c4dfd21dd219feb59154571db15dd`.
- Immutable `nba-v9` Markdown SHA-256 is
  `03f6a61ee6ef958cae2ae9b918d7b6a115ff0d346f63202efce8780744fbadf2`;
  canonical JSON SHA-256 is
  `0ac3fecc04e12b88134ce97d11fbe1c742af1f21664a9c80eaf0d76ab7cfcfba`.
- The current review set has SHA-256
  `99f637a0f2195614ff84b9afbdafb236039efcadb4eb7510e66af43f855f58da`;
  the private manifest has SHA-256
  `6e236ae2ced75a1df030ca1c7c8008dbc67c24a48c9ac8769b862ca7e9d6ca03`
  and 918 paths; the historical served receipt has SHA-256
  `7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`.
- Decision 16 is owner-closed as partially complete. Its final report,
  SHA-256
  `3a043231c575aa8c204bb0ab4664962fbbc1b36148b8a3ca9fea90ccd750194e`,
  explicitly records that `npm run private:verify -- --credential-source
  local-file` did not pass and that no D16 receipt was produced. This conflicts
  with the planning instruction's premise that D16 just fixed the command.
  Execution must not manufacture a green baseline. Before any D17 phase, a
  separately governed predecessor cycle must already have committed current
  successful served-review evidence that matches the then-current review set
  and private manifest. D17 preserves the verifier code and also requires its
  own real final pass; it stops for separate authority if the recorded
  pre-existing transport failure persists or if a repair is needed.
- `allowIndexing=false`. Existing private-service identity, authentication,
  listener, configuration, credentials, and historical receipt are frozen
  operational inputs, not general service authority.

## Task 0 — Require exact authorization before execution

From a clean worktree, require both (a) the owner-supplied strict decision and
exact binding and (b) a separately governed predecessor commit containing a
successful current served-review receipt/evidence before any phase below.
The predecessor evidence must bind the exact then-current review-set response
and private-manifest digest/path set and must postdate the recorded D16
partial-close failure. Task 0 only reads and validates that committed evidence;
it must not invoke `private:verify`, rewrite a receipt, repair transport, or
count the historical stale receipt as success.

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D17_PLAN="docs/superpowers/plans/2026-08-14-decision-17-case-filter-and-followup-notes.md"
ATLAS_D17_DECISION="docs/decisions/2026-08-14-decision-17-case-filter-and-followup-notes-authorization.v1.json"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=all)"
npm run plan:decision:verify -- --decision "$ATLAS_D17_DECISION" --plan "$ATLAS_D17_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_D17_PLAN"
npm run private:receipt:check -- \
  --receipt review/served-review-receipt.v1.json \
  --manifest review/private-dist-manifest.v1.json \
  --review-set review/review-set.v1.json
```

Any runtime mismatch, dirty tree, missing/stale decision, owner/role/scope/
closed-scope mismatch, plan digest mismatch, failed binding, or failed
authorization assertion stops execution. Missing, stale, failed, or
non-machine-verifiable predecessor success evidence also stops execution
before Phase 0. `private:receipt:check` is intentionally required as a
non-mutating predecessor-provided command; it does not exist at the frozen
planning baseline, so adding that checker or obtaining a new receipt belongs
to the separately authorized predecessor cycle, not D17. Conversation text,
the instruction that D16 was fixed, and this plan's `not-authorized` binding
are not substitutes. The command must be read-only and must validate canonical
receipt bytes/schema, a successful `checkedAt` and commit provenance after the
D16 partial-close report, the exact current review-set response SHA-256, the
private-manifest digest, and complete authorized/unauthorized path coverage;
it must not write or normalize a receipt. Task 0 does not run during the
current cycle.

## Phase 0 — Freeze the bounded baseline and add regression contracts

1. Record the authorized starting commit. Re-hash all 26 cases, three injury
   overviews, the quarterly update, `nba-v1`–`nba-v9`, player-photo registry
   v1–v8, the 21 current cover files, filter/index code, layered-note/video
   components and scripts, review digest renderers, review set, private
   manifest, the separately committed successful served receipt, noindex
   state, verifier, and artifact checks. Record that no follow-up sidecar
   directory/file is silently inherited, or enumerate and stop on drift.
2. Generate a deterministic baseline ledger containing every case's existing
   clinical-core digest and exact review identity fields; the 7/18/1
   video-source classification; every current cover path/byte length/SHA-256;
   v9 policy digests; and review/private artifact identities. Stop on any
   mismatch with the frozen planning baseline.
3. Add a Decision 17 regression contract before product changes. It must fail
   on any changed case-v1 byte, changed cover byte, changed registry selection,
   changed existing review identity/digest, changed 30-file aggregate, changed
   CC BY-SA composition behavior, an NBA navigable sink, missing digest DOM
   value, or unauthorized medical-approval state.
4. Preserve both the D16 failure evidence and the separately governed later
   success evidence truthfully. Do not rewrite either or claim D17 produced
   the predecessor success. Unit-level verifier and artifact checks must
   remain green; D17's live verifier invocation occurs only after the ordered
   final artifact reload in Phase 5.
5. Commit only the baseline ledger, D17 contract, tests, and Phase 0 evidence.
   No policy, case, sidecar, page, component, index shard, review artifact,
   `dist`, or service mutation occurs. Require a clean worktree before Phase
   1.

### Phase 0 acceptance and evidence

- A Phase 0 report records exact hashes/counts, all 26 approval-lineage rows,
  the 7/18/1 classification, the 21-cover ledger, CC BY-SA guard status,
  artifact identities, the D16 verifier discrepancy, and the separate later
  predecessor success without conflating their authority or chronology.
- Negative fixtures fail for every protected boundary. No owner identity,
  medical decision, policy version, content draft, build output, or service
  action is created.
- A conventional local Phase 0 commit exists and the worktree is clean.

## Phase 1 — Add the tenth video-source filter (Decision A)

1. Add one pure, exhaustive derivation function for the three video-source
   tokens. NBA-host detection has precedence over the generic
   `external-link-only` status. Unknown provider/host/status combinations
   throw during index construction rather than defaulting to a misleading
   category.
2. Extend `CaseIndexEntry`, both build-mode shard projections, filter state,
   empty-state detection, query parse/serialization, form prefill/read,
   compound matching, reset behavior, and the accessible form with a
   `videoSource` select and the three visible labels. Do not add canonical
   video URLs, publishers, or arbitrary HTML to the minimal index.
3. Preserve lazy loading, 100-entry shards, the 12-result progressive display,
   static no-JavaScript listings, the distinction between diagnosis
   confirmation and workflow status, and deterministic query ordering.
4. Add pure fictional tests for each source token, invalid combinations,
   query round-trip/reset, zero results, and compounds with every existing
   dimension. Add real-content assertions for the exact 7/18/1 partition and
   exact named membership frozen above.
5. Exercise every generated HTML and JSON route. For all 18 NBA cases, require
   zero NBA anchors/iframes/metadata targets/JSON-LD URLs/scripts/redirects and
   zero filter-driven redirect sink. The case-index JSON may contain only the
   token `nba-plain-text-citation`, never an NBA URL. Preserve the full URL as
   literal text only in the existing citation renderer.
6. Commit the bounded filter/index/UI/tests/evidence work. No case data,
   clinical prose, cover, policy, review artifact, `dist`, or service action
   occurs. Require a clean worktree before Phase 2.

### Phase 1 acceptance and evidence

- The UI exposes ten non-classic filter dimensions plus the existing classic
  checkbox, and the video-source filter composes correctly with all nine
  existing dimensions.
- Real records reproduce 7 YouTube embed, 18 NBA plain-text citation, and one
  external-link result; Anthony Edwards 2023 is the sole third group.
- NBA targets remain non-navigable in HTML, JSON-LD, scripts, and generated
  index data. Existing accessibility and no-JavaScript behavior pass.
- All 21 covers, all clinical-core values, v1–v9 policies, review artifacts,
  and closed scopes are unchanged. A conventional local Phase 1 commit exists
  and the worktree is clean.

## Phase 2 — Simplify the layered notes (Decision B-1)

1. Remove “發生了什麼”, “畫面看得到什麼”, and every “影片段落觀察”/
   timeline presentation from production and review-fixture DOM. Retain their
   underlying approved source facts and strings as non-rendered historical
   clinical-core inputs; do not delete/rewrite them and silently rebake the
   owner's existing approval.
2. Keep a non-empty reader layer containing the heading “畫面不能證明什麼” and
   the exact existing `whatVideoCannotProve` text. Keep the complete
   professional layer unchanged. Remove `confirmedUpdate` from the reader
   layer; Phase 3 renders its approved diagnosis projection in the new
   follow-up block.
3. Narrow `LayeredNotes` props to the fields it still renders, remove its
   default slot, delete all obsolete timeline/segment DOM branches and unused
   imports, and remove dead timeline wiring from the video script if it has no
   remaining consumer. Do not remove `video.segments` from the approved
   clinical-core data.
4. Keep the two native emphasis buttons because both layers still exist. Make
   the script require exactly the expected reader/professional controls and
   targets, update `aria-pressed` without hiding content or moving focus, and
   remain fully readable without JavaScript. Remove stale CSS, labels,
   `aria-controls`, tests, and fixture branches tied only to deleted DOM.
5. Add DOM, accessibility, keyboard, no-JavaScript, and mobile/desktop visual
   assertions proving there is no empty layer, broken control, duplicate
   content, dangling timeline behavior, or occurrence of the three removed
   presentations.
6. Commit only B-1 presentation/script/tests/evidence. No medical text, case
   record, policy, cover, existing digest calculation, review artifact,
   `dist`, or service changes. Require a clean worktree before Phase 3.

### Phase 2 acceptance and evidence

- The reader layer contains only “畫面不能證明什麼”; the professional layer is
  complete; both remain in the DOM and the emphasis switch is valid with and
  without JavaScript.
- “發生了什麼”, “畫面看得到什麼”, and video-segment/timeline observations no
  longer render anywhere in real or fixture case pages. Their underlying
  approved data and existing clinical-core digests remain unchanged.
- All 21 covers, CC BY-SA behavior, 26 review identities, policies, artifacts,
  and closed scopes remain unchanged. A conventional local Phase 2 commit
  exists and the worktree is clean.

## Phase 3 — Govern and draft complete follow-up reporting (Decision B-2)

This is the only phase permitted to exercise `medical-content-authoring`.
No other phase may add or revise a medical statement.

1. Add immutable `nba-v10` Markdown/canonical-JSON successors and a
   deterministic generator/checker. Bind exact v9 digests. Preserve all
   compatible v9 controls, narrowly supersede only its inherited
   `medical-content-authoring` closure for this exact pending-authoring scope,
   and add the follow-up source hierarchy, item contract, third-party
   attribution, empty-state, actual-return, pending-review, and NBA non-link
   rules defined above. Encode
   `createsExecutionAuthorization=false`, the exact Decision 17 follow-up
   boundary, and all seven closed scopes. Treat every collected source as at
   most `source-ready`; v10 cannot grant execution or source/medical approval.
2. Add strict `case-follow-up.v1` sidecars only at
   `src/content/follow-ups/<case-slug>.json`, plus their loader and digest
   contract, without altering a case-v1 byte or the existing clinical-core
   digest function. Validate each case ID/core digest binding, the
   legacy-diagnosis source reference/tier, four arrays, item payload digest,
   exact pending-review binding, and no aggregate self-digest. Negative
   fixtures reject changed/stale case bindings, shared paragraph sources,
   absent dates/URLs, unknown tiers/kinds, inferred facts, projected return
   fields, future or `unverified-report` actual-return dates, reviewer identity
   on pending items, digest self-reference, and any attempt to write a draft
   digest into the existing approval field.
3. Before drafting, perform a bounded source audit for all 26 cases and all
   four new fact kinds. Open each retained original page; never use a search
   snippet as evidence. Record query boundaries, canonical/final URL,
   publisher/account, title, publication/access dates, medium, tier basis,
   supported fact, and not-found outcome in exact
   `research/follow-ups/decision-17/<case-slug>.json` evidence. A reporter
   social post is `mainstream-media-report` only when the named
   reporter/outlet affiliation is identifiable; otherwise it remains
   `unverified-report`. Research evidence is `source-ready`, never
   source-reviewed.
4. Draft one atomic item per supported reported fact. Paraphrase only what its
   own source says, attribute the statement to that source, and repeat an
   item-level citation even when another item uses the same page. Do not infer
   a procedure, injection, rehabilitation course, causation, outcome, or
   return from diagnosis, absence, roster status, video, or another item's
   source.
5. For treatment, surgery, and injection, store only the reported intervention
   and supported date; do not interpret appropriateness or efficacy. For
   actual return, require documented participation and an occurred date,
   render the retrospective-only reconciliation statement, and mechanically
   forbid predictive/target/recommended fields and copy.
6. Leave unsupported category arrays empty and render the exact explicit empty
   state. An empty category is a successful no-fabrication outcome, not a
   reason to expand the search indefinitely or fill a typical treatment.
7. Build a dedicated follow-up renderer. Display the fixed block-level
   third-party attribution, approved legacy diagnosis item with its own
   visible source-tier label and existing source/date, each new item with
   visible kind, source-tier label, source/date, and “待醫師簽核” state, and
   every empty category. Reuse the central NBA presentation function so NBA
   sources show full literal URLs but no anchors; other valid HTTPS sources
   may be clickable.
8. In review builds, show all pending items and their draft digest. Any public
   projection omits or fails closed on pending items and may show only content
   covered by an exact owner approval. Do not change the 26 existing review
   objects or create/apply a medical-review decision.
9. Add the version-2 schema plus parser/generator/route/tooling support for the
   governed target `review/review-set.v2.json` exactly as specified in
   Approval and digest lineage. Its generated authority snapshot will bind
   the strict Decision 17 authorization used to create the drafts, while every
   medical item remains pending. Preserve v1 bytes and prove
   medical-review-decision v1 fails closed on a v2 pending fixture. Do not
   generate or commit the governed v2 artifact in this phase; Phase 5 owns the
   ordered review-set generation and review-set-only commit.
10. Run schema, policy, source-audit, atomic attribution, pending-state,
   digest-lineage, source-link, NBA zero-link, selector, route, accessibility,
   review-set-v2 dispatch, and visual tests. Compare all 26 case files, all
   other clinical-freeze files, all 21 covers, registry v8, and policies v1–v9
   byte-for-byte against Phase 0.
11. Commit the immutable v10 policy/contract first, then the sidecar/research/
    UI/tooling work in conventional local commits with clean boundaries. No
    owner signoff, final review-set generation, final build, private manifest,
    service action, or public projection occurs in this phase.

### Phase 3 acceptance and evidence

- `nba-v10` regenerates byte-for-byte, binds v9, changes only the follow-up
  annex and exact `medical-content-authoring` boundary needed by it, and leaves
  existing source manifests/video provenance on `nba-v2`. Every v9 photo and
  CC BY-SA rule still passes; all seven other closed scopes remain closed.
- All 26 cases have a complete bounded audit across treatment, surgery,
  injection, and actual return. Every retained fact is atomic and individually
  sourced/dated/tiered; every not-found category is an empty array with the
  explicit UI state.
- The third-party attribution statement and visible tier labels—including
  each legacy confirmed-diagnosis projection—appear on screen. NBA citations
  remain pure text; non-NBA links are direct sources, never an Atlas redirect.
- All newly drafted items remain `pending-owner-signoff` with no reviewer or
  decision data. Existing named owner approvals and clinical-core digests are
  unchanged and independently visible. A later physician editor cycle is
  still required.
- Actual-return rows are occurred historical facts only and coexist with the
  unchanged “不是套用固定回場日期” professional guidance without prediction or
  recommendation.
- All 26 case-v1 files, the other four clinical-freeze files, all 21 cover
  files, and registry v8 are byte-identical. Sidecar digests are independent;
  no closed scope is crossed, and clean conventional Phase 3 commits exist.

## Phase 4 — Collapse review identity and digests by default (Decision C)

1. Wrap the review-only “審查識別與 digest” content in native
   `<details><summary>` with no `open` attribute. Use the summary as the
   accessible disclosure label and keep record ID, case-content digest,
   rendered-set digest, and the new pending follow-up digest when present
   inside the disclosure.
2. Do not remove, lazily inject, mask, truncate, or replace any digest value.
   Keep the existing `computeCaseContentDigest(record)` and
   `computeRenderedSetDigest(permitted)` calls and input values unchanged.
   Copy/select behavior must work after opening the native disclosure.
3. Add static DOM tests proving the block is closed by default, all values are
   present in server HTML, no JavaScript is needed, inputs remain readonly and
   copyable, IDs/labels are unique, and opening/closing does not change any
   digest or review-set identity.
4. Perform desktop/mobile keyboard and screen-reader-oriented checks for
   focus, name, state, target size, overflow, and copy access. Keep the block
   review-only and do not move it out of its current case-page order.
5. Commit only the C disclosure/tests/evidence work. No case data, medical
   content, policy, cover, digest algorithm, review artifact, `dist`, or
   service mutation occurs. Require a clean worktree before Phase 5.

### Phase 4 acceptance and evidence

- The disclosure is closed by default and native-keyboard operable. Record ID
  and every digest remain literal server-rendered DOM values and copyable.
- Existing case-content and rendered-set digest calculations are byte-for-
  byte unchanged; the separate pending digest stays explicitly labeled.
- A conventional local Phase 4 commit exists, all protected inputs are
  unchanged, and the worktree is clean.

## Phase 5 — Integrated validation and ordered private artifact handoff

1. From the clean Phase 4 source/content commit, run the complete unit/
   coverage, TypeScript/Astro, formatting, content, policy v1–v10,
   plan-binding, filter, clinical-core/follow-up digest, source attribution,
   NBA link, routes, Playwright/axe, Lighthouse, cover/photo/credit/focal,
   CC BY-SA, noindex, artifact-size, private-verifier unit, and Git whitespace
   suites. Record exact commands, exit codes, counts, and stricter totals.
2. Require exact equality for all 26 case-v1 files, the other four
   clinical-freeze files and their aggregate, all 21 cover files and registry
   v8, all existing clinical-core projections/review identities, v1–v9
   policies, the professional “不是套用固定回場日期” statement, and every
   closed-scope negative. Enumerate and justify every changed path.
3. Follow the final artifact chain in exactly this order—do not run a final
   review build ahead of its review-set commit:

   ```text
   review-set generation → review-set-only commit → build:review
   → private:manifest → private-manifest-only commit → kickstart
   ```

   Run `npm run review-set:generate` from the clean source/content commit and
   require it to write only `review/review-set.v2.json`; v1 remains unchanged.
   Prove v2 binds approved core, pending sidecar digests, and the exact D17
   authoring-authority snapshot, then commit v2 alone. Require the active
   `/review/review-set.json` route and all downstream tooling to use the exact
   v2 bytes, with no v1 fallback. Then run `npm run build:review` and
   `npm run verify:review-artifact` from that clean review-set-v2 commit.
   Generate the private manifest, prove only its expected path changed, verify
   it against disk and v2 bytes, and commit it alone.
4. Inspect the built artifact for all 26 cases and both viewports. Require the
   exact 7/18/1 filter partition, removed B-1 DOM, visible B-2 attribution/
   tier/source/date/pending/empty states, C collapsed-but-present digests,
   zero NBA navigation/redirect sinks, zero pending content in any public
   projection, complete routes, file-size compliance, and private/noindex
   headers.
5. Only after the private-manifest commit and a clean worktree, invoke exactly
   once:

   ```bash
   launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1
   ```

   No earlier/additional reload, restart, load/unload, reconfiguration,
   reprovisioning, credential/listener/port/Tailscale change, or alternate
   service action is permitted.
6. Before the live request, prove the review build, private manifest, server,
   verifier, receipt schema, and release gate all resolve review-set v2 and
   that `medical-review-decision.v1` rejects this pending v2 set. Run the
   actual repository command
   `npm run private:verify -- --credential-source local-file` and require exit
   0 over the complete committed manifest. It must write a current governed
   receipt only on success. A unit test, manual curl, sample, prior receipt, or
   ad hoc verifier cannot substitute. If the D16 transport failure persists,
   record it truthfully and stop; do not patch the verifier or broaden service
   authority inside D17.
7. Prove only the served receipt changed after the passing verifier and commit
   it separately. Add final docs-only evidence binding source/content,
   review-set, build/private-manifest, receipt, policy, protected-cover, and
   pending-medical-draft digests. Finish with a clean worktree and no push.

### Phase 5 acceptance and evidence

- A final-validation report records complete test totals, exact 7/18/1
  membership, all B-1/B-2/C DOM and accessibility evidence, v10 lineage,
  item-level sources/tiers/empty states, unchanged approved-core lineage,
  21-cover equality, CC BY-SA checks, NBA zero-link checks, and closed-scope
  negatives.
- The artifact chain order is exact; `review/review-set.v2.json` and the
  private manifest commits are isolated; v1 bytes are historical and
  unchanged; exactly one kickstart occurs after the manifest commit.
- Repository `private:verify` passes in fact and a current receipt binds every
  manifest path. D17 is incomplete if it fails, but failure is not authority
  to repair an unrelated pre-existing verifier/service problem.
- Every new medical item is still pending physician signoff. No publication,
  deployment, indexing, medical-review decision, service/configuration change
  beyond the enumerated reload, external-account action, remote mutation, or
  push occurs.

## Completion conditions

- The tenth filter is visible, accessible, query-stable, compound-safe, and
  reproduces the exact 7/18/1 source partition without putting video URLs in
  case-index JSON.
- All 18 NBA video sources and every other NBA citation remain visible as
  literal text but produce no anchor, redirect, iframe, metadata/JSON-LD URL,
  or script sink.
- The reader layer retains only “畫面不能證明什麼”; the professional layer is
  unchanged; the removed B-1 items have no rendered or scripted remnants.
- Every B-2 item has its own source target/date and visible tier, the block has
  the exact third-party attribution, empty categories are explicit and
  non-inferential, and actual-return rows are occurred facts only.
- `nba-v10` is append-only and narrow. Existing video/source-manifest policy
  bindings remain on v2, v9 photo/CC BY-SA behavior is unchanged, and all
  v1–v9 bytes remain immutable.
- The 26 existing owner approvals remain bound to unchanged clinical-core
  digests, and all 26 case-v1 files remain byte-identical. New sidecar digests
  remain separately pending with no Codex-generated reviewer identity or
  decision. Review-set v2 binds both lineages without making v1 medical-review
  decisions applicable to the pending sidecars.
- The review digest disclosure is closed by default but retains record ID and
  every copyable digest in server HTML. Existing digest functions are
  unchanged.
- All 21 cover files are byte-identical and the CC BY-SA composition firewall
  remains active. All non-B-1/B-2 clinical content is unchanged.
- The ordered artifact chain completes under Node 24.14.0, exactly one final
  kickstart occurs, and the real private verifier passes. Every closed scope
  remains closed, `allowIndexing=false`, and no push occurs.

## Risks and controls

- **Approval-lineage laundering:** Separate approved core and pending
  sidecar digests, freeze all case-v1 bytes, and bind each sidecar to the
  unchanged case digest. Never recompute the old approval over new text or
  copy the owner's name into a new state.
- **Third-party report becoming the physician's statement:** Require fixed
  block attribution, item-level named attribution, visible tier labels, and
  pending status; test rendered copy, not only data.
- **Tier inflation:** Contract exact official/mainstream/unverified criteria,
  retain publisher/account evidence, and fail ambiguous reporter affiliation
  into `unverified-report`.
- **Shared citations hiding unsupported facts:** One atomic fact carries its
  own source and date. A source list after a paragraph cannot satisfy the
  contract.
- **Speculative treatment or return:** Empty remains empty. Actual return
  requires retrospective participation evidence and forbids projection fields
  and predictive language.
- **Conflict with individualized RTP guidance:** Label actual return as a past
  case fact and preserve the unchanged no-fixed-date professional statement.
- **NBA deep-link regression:** Derive NBA classification centrally, keep URLs
  out of shards, reuse the fail-closed citation renderer, and scan attributes,
  JSON-LD, inline scripts, and redirect files in the built artifact.
- **False seven-embed claim:** Define the filter from verified review embed
  status and separately preserve the public caption-degradation rule.
- **Empty/broken layered UI:** Keep both non-empty layers, delete the obsolete
  slot/timeline wiring, and exercise no-JavaScript plus keyboard behavior.
- **Digest concealment:** Native disclosure changes default layout only;
  server-DOM and copy-value tests bind all identifiers and digests.
- **Cover or ShareAlike collateral:** Freeze every selected cover byte and
  registry row; keep all composition firewall positive/negative fixtures in
  every phase.
- **Policy staleness cascade:** Bind follow-up items to a separate v10 current
  constant; never retag existing v2 source manifests or video provenance.
- **Pre-existing verifier failure:** Preserve truthful D16 evidence, require a
  separately governed, current passing predecessor receipt before Phase 0;
  preserve truthful D16 evidence, require a real D17 final pass, and stop
  rather than silently widening D17 into a verifier or service repair.
- **Digest self-reference or review-set downgrade:** Hash each item without its
  review binding, bind that payload digest from the pending object, compute the
  aggregate from canonical sidecar bytes without storing it inside itself,
  and move all active artifact tooling to v2 with no fallback to v1.

## Rollback

- Roll forward with corrective commits or use `git revert`; never reset
  destructively, rewrite history, force push, or edit bound policy/review
  evidence in place.
- A v10 defect requires append-only `nba-v11`; do not mutate `nba-v10`,
  `nba-v9`, or `nba-v2`.
  A sidecar draft correction produces new item/aggregate digests and remains
  pending; it never overwrites the approved clinical-core lineage or any case
  byte.
- Remove or correct an invalid pending item and rebuild the dependent review
  artifacts through the same ordered chain. Never replace a not-found result
  with an inferred typical fact merely to restore layout.
- A filter/B-1/C defect may be reverted without touching case medical data or
  covers. A cover/registry byte mismatch stops rollback until the protected
  bytes are restored through a non-destructive corrective commit.
- After any served-artifact rollback, another reload, receipt, public action,
  medical decision, service mutation, or remote operation requires exact
  authority; the one Decision 17 kickstart is not reusable.
- Publication, deployment, indexing, hosting/account/remote mutation,
  medical-review decisions, and push remain closed during rollback.

## Current planning-cycle bind and stop

The present task performs only plan drafting and `not-authorized`
registration:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D17_PLAN="docs/superpowers/plans/2026-08-14-decision-17-case-filter-and-followup-notes.md"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=no)"
test "$(git status --porcelain --untracked-files=all)" = "?? $ATLAS_D17_PLAN"
npx prettier --check "$ATLAS_D17_PLAN"
git diff --check
npm run plan:bind -- "$ATLAS_D17_PLAN" \
  --status not-authorized \
  --role decision-17-case-filter-and-followup-notes \
  --scope decision-17-case-filter-and-followup-notes-only \
  --closed-scopes deployment,external-account-mutation,hosting-service-mutation,indexing,medical-review-decision,public-release,remote-repository-mutation
npm run plan:verify
git diff --check
ATLAS_D17_SHA="$(/usr/bin/shasum -a 256 "$ATLAS_D17_PLAN" | /usr/bin/cut -d ' ' -f 1)"
test "$(jq -r --arg path "$ATLAS_D17_PLAN" '.documents[] | select(.path == $path) | .sha256' docs/decisions/plan-binding.v1.json)" = "$ATLAS_D17_SHA"
```

Require the separate negative `npm run plan:assert-authorized --
"$ATLAS_D17_PLAN"` result to fail specifically because status is
`not-authorized`. Compute the plan's raw-byte SHA-256, verify it equals the new
binding entry, stage only this plan and
`docs/decisions/plan-binding.v1.json`, and make one local commit named
`docs(governance): register Decision 17 case filter and follow-up notes plan`.
Then stop. Do not create the authorization JSON, create `nba-v10`, research or
draft any follow-up, or execute Task 0 or Phase 0–5.
