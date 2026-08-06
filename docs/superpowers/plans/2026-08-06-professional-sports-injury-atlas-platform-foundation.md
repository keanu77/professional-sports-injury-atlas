# Professional Sports Injury Atlas Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一個獨立、可測試、預設 noindex、支援多運動資料模型的 Astro 靜態網站底座，完整實作案例契約、逐案例 digest、影片降級、傷種圖鑑 UI、搜尋篩選與 fail-closed 發布閘門，但不加入真實 NBA 案例、不部署、不公開。

**Architecture:** 每個案例是一份 strict JSON content entry；Zod 處理單筆結構，純 TypeScript validators 處理跨欄位與跨案例規則。醫療審查綁定逐案例 canonical SHA-256，站級索引授權另綁 approved-case manifest digest。Astro 只輸出靜態 HTML；少量原生 TypeScript 提供 click-to-load 播放器、篩選、theme 與字級控制。既有 RTP catalog 只由 read-only importer 驗證並擷取三門課摘要，傷種與課程透過顯式 scope mapping 連結。

**Tech Stack:** Node.js 24.14.0、npm、Astro 7.1.6、TypeScript 5.9.3、Zod 4 via `astro/zod`、Vitest 4.1.10、Playwright 1.62.1、`@axe-core/playwright` 4.12.1、Prettier 3.9.6、原生 CSS／TypeScript、SHA-256。

---

## Scope and authority

- Execution role: `platform-foundation`; execution scope ID: `g0-local-repository-and-platform-foundation`; required closed scope IDs: `nba-source-discovery`, `medical-content-authoring`, `private-hosting`, `public-release`, `deployment`.
- Project root after Gate G0: `/Users/ethanwu/Documents/AI class/202608 RTP_ankle sprain_Ethan/professional-sports-injury-atlas`
- Specification: parent `docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md`; G0 requires the user to confirm its exact current SHA-256 before this plan is authorized.
- This plan starts only after the bootstrap decision file authorizes a local Git repository.
- No remote, push, PR, hosting, DNS, public indexing, analytics, NBA content download, or real case authoring is included.
- Test fixtures must be fictional and must never contain a real athlete, team, diagnosis, or video ID.
- The standard review build may contain a review-only component lab, but no real case data.
- Public release is deliberately impossible at the end of this plan.
- Every new execution shell first runs `ATLAS_NODE_BIN="/Users/ethanwu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"`, `export PATH="$ATLAS_NODE_BIN:$PATH"`, and `test "$(node --version)" = "v24.14.0"` before any npm command.

## Exact dependency contract

`package.json` pins these versions without ranges:

```json
{
  "dependencies": {
    "@fontsource/barlow-condensed": "5.3.0",
    "@fontsource/fraunces": "5.3.0",
    "@fontsource/inter": "5.3.0",
    "astro": "7.1.6"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "@axe-core/playwright": "4.12.1",
    "@playwright/test": "1.62.1",
    "@types/node": "24.13.3",
    "@vitest/coverage-v8": "4.1.10",
    "chrome-launcher": "1.2.1",
    "lighthouse": "13.4.1",
    "prettier": "3.9.6",
    "prettier-plugin-astro": "0.14.1",
    "tsx": "4.23.8",
    "typescript": "5.9.3",
    "vitest": "4.1.10"
  }
}
```

`package-lock.json` is the reproducibility authority. CI and clean verification use `npm ci`; implementation dependency changes use `npm install` and review the lock diff.

## Controlled enums and invariants

The implementation uses these exact tokens:

```ts
type CaseStatus =
  | 'draft'
  | 'source-verified'
  | 'medical-review'
  | 'approved'
  | 'rejected'
  | 'retired';

type ConfirmationStatus = 'unconfirmed' | 'confirmed' | 'conflicted';
type ReviewStatus = 'not-requested' | 'in-review' | 'approved' | 'changes-requested';
type EmbedStatus = 'verified' | 'external-link-only' | 'unavailable';
type CaptionStatus = 'available' | 'unavailable' | 'not-verified';
type VideoProviderCode = 'youtube' | 'nba';
type VideoContentType = 'in-game-injury-event';
type ProvenanceStatus = 'pending' | 'verified' | 'rejected';
type PublicRightsStatus = 'not-requested' | 'cleared' | 'rejected';
type InjuryCode = 'acl' | 'ankle-sprain' | 'achilles-rupture';
type SourceType =
  | 'diagnosis-first-party'
  | 'diagnosis-secondary'
  | 'video-original'
  | 'event-context'
  | 'teaching-evidence';
type SourceSupportPath =
  | 'general.whatHappened'
  | 'injury.confirmedDiagnosis'
  | 'general.whatIsVisible'
  | 'general.confirmedUpdate'
  | 'professional.mechanismAnalysis'
  | 'professional.clinicalLimitations'
  | 'professional.differentialContext'
  | 'professional.treatmentAndRtpMeaning'
  | 'video.segmentObservation';
```

Single-entry schema rules:

- `schemaVersion` is integer `1`.
- `id` pattern is `^CASE-[A-Z0-9]+-[0-9]{4}-[0-9]{3}$`; `slug` is lower-kebab-case.
- Case IDs and slugs are globally unique; every content filename is exactly `{slug}.json`, so `/cases/{slug}/` has a one-to-one route. Source IDs are also globally unique across the case collection, not merely within one case.
- `sport.code` and `league.code` are strings validated against registries, not hard-coded into display components.
- Generic `season` pattern is `^(19|20)[0-9]{2}(-[0-9]{2})?$`; the NBA cross-validator requires the two-year `YYYY-YY` form, while the registry can later define a single-year MLB form. All dates are ISO `YYYY-MM-DD` or UTC date-time strings.
- `eventDate >= 2016-08-06` is a normal recent case. Earlier events require `isClassic=true`, non-empty `classicReason`, and non-empty `classicProposedBy` from initial authoring. `classicExceptionApprovedBy` is nullable before medical approval; an approved classic requires it to be non-empty and equal the same case's medical reviewer name.
- `injury.confirmationStatus='confirmed'` is required for approved/public selection.
- `observedMechanismTags` are observation taxonomy only; UI labels must not call them a diagnosis.
- Video URLs and all source URLs are HTTPS. Arbitrary iframe HTML and stored thumbnail URLs are forbidden. Launch cases require `video.contentType='in-game-injury-event'`; the event source and source-audit record must bind the video to the same athlete, event date, opponent and competition. Interviews, news recaps, practice, warm-up, rehabilitation, analysis and compilations fail as the primary video even when uploaded by an official channel.
- Provider/host/embed state is registry-controlled: only YouTube hosts may be embedded; NBA.com and later tested rightsholder providers are external-link-only. Adding a provider requires an explicit registry/test change.
- Every video records caption availability and check date. The site never stores a transcript; it exposes the original platform/player caption entry or clearly says captions were unavailable/not verified.
- Segment times are integers, ordered, non-overlapping, `0 <= start < end <= durationSeconds`.
- `professional.claims[]` is the atomic evidence contract. Every claim has stable ID, one professional field path, exact text, and non-empty evidence IDs resolving to `teaching-evidence` sources that support that path. For each field, joining its ordered claim texts with a blank line must exactly reproduce the field text; `professional.evidenceIds` must exactly equal the sorted unique union of all claim evidence IDs.
- Recent approved cases require at least one `diagnosis-first-party` source. An older classic also passes with at least one `diagnosis-first-party` source; only when the first-party original is unavailable may it use at least two `diagnosis-secondary` sources with distinct `independenceGroup` values that do not share the same non-null syndicated `originReportId`.
- Approved medical cases require `sourceProvenanceVerification.status='verified'`, named verifier, verification date, and basis. They may still have `publicRightsReview.status='not-requested'`.
- Public selection additionally requires `publicRightsReview.status='cleared'`, a named rights reviewer/date, and a matching video-source digest. Provenance verification and public rights clearance are never interchangeable.
- `review.status='approved'` requires named reviewer, qualification, review date, and a 64-character lowercase digest matching the current case clinical payload.
- Workflow status; audit/access/check timestamps; medical reviewer, classic proposer/approver, source verifier and public-rights reviewer fields; indexing fields; and visual tokens are excluded from the case clinical digest. Stable video/source/provenance facts and clinical content remain included.
- `unavailable` cases remain in audit data but are omitted from public counts and normal case lists.
- Each launch injury has one strict injury-overview entry with atomic evidence claims and its own matching named medical-review digest. Overview content gives scope, basic anatomy/definition, non-diagnostic common observed mechanisms, what video cannot prove, and high-level diagnosis/treatment/RTP context without reproducing a full RTP prescription.
- Site identity is text-only plus CSS geometry. No league/team marks, downloaded thumbnails, locally renamed logos, or imagery implying NBA endorsement are permitted; source and build policy tests enforce an empty image-asset allowlist for the foundation.

## Planned project tree

```text
professional-sports-injury-atlas/
├── .node-version
├── .prettierignore
├── astro.config.mjs
├── package.json
├── package-lock.json
├── playwright.config.ts
├── prettier.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── docs/
│   ├── architecture.md
│   ├── content-contract.md
│   ├── decisions/plan-binding.v1.json
│   ├── operations/quarterly-curation-runbook.md
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── ops/http-header-policy.v1.json
├── public-release-history/public-release-history.v1.json
├── research/
│   ├── source-manifest-registry.v1.json
│   ├── source-manifests/
│   └── reviews/source-batches/
├── review/
│   ├── review-set-manifest.v1.json       # generated only after real G3 content commit
│   └── medical-review-decision.v1.json  # created only after named private review
├── scripts/
│   ├── check-content.ts
│   ├── export-case-schema.ts
│   ├── import-rtp-catalog.ts
│   ├── release-check.ts
│   ├── run-lighthouse.ts
│   ├── generate-review-set.ts
│   ├── bind-authority-document.ts
│   ├── verify-plan-binding.ts
│   ├── verify-external-sources.ts
│   ├── verify-public-artifact.ts
│   └── verify-review-artifact.ts
├── src/
│   ├── components/
│   ├── content/cases/
│   ├── content/injuries/
│   ├── content/updates/
│   ├── content.config.ts
│   ├── data/
│   │   ├── generated/rtp-course-summaries.v1.json
│   │   ├── professional-course-links.v1.json
│   │   ├── site-governance.v1.json
│   │   ├── brand-asset-policy.v1.json
│   │   └── taxonomy/
│   ├── layouts/BaseLayout.astro
│   ├── lib/contracts/
│   ├── pages/
│   ├── scripts/
│   └── styles/
├── tests/
│   ├── fixtures/
│   └── unit/
└── e2e/
```

### Task 0: Bootstrap the isolated local repository

**Files:**

- Verify: parent `docs/decisions/2026-08-06-atlas-bootstrap.md`
- Create: `.node-version`
- Create: `.gitignore`
- Create: `.prettierignore`
- Create: `README.md`
- Copy exactly: `docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md`
- Copy exactly: `docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-execution-index.md`
- Copy exactly: `docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-platform-foundation.md`
- Copy exactly: `docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md`
- Copy exactly: `docs/decisions/2026-08-06-atlas-bootstrap.md`
- Create: `docs/decisions/plan-binding.v1.json`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `prettier.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `scripts/verify-plan-binding.ts`
- Create: `scripts/bind-authority-document.ts`
- Create: `scripts/assert-plan-authorized.ts`
- Create: `scripts/resolve-active-plan.ts`
- Create: `scripts/validate-plan-execution-decision.ts`
- Create: `tests/unit/plan-binding.test.ts`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Assert authorization and clean target**

The bootstrap decision is created only after the user both confirms the red-team clarification and explicitly authorizes G0. It uses one anchored key per line: `decisionSchemaVersion: 1`, `redTeamSpecStatus: confirmed`, `g0ExecutionStatus: authorized`, `authorizedScope: local-git-and-platform-foundation-only`, exact SHA-256 values for the spec/controller/platform plan, non-empty `authorizedBy` and ISO-8601 `authorizedAt`, plus exact `sourceDiscoveryExecutionStatus: not-authorized`, `medicalAuthoringExecutionStatus: not-authorized`, `hostingExecutionStatus: not-authorized`, `publicReleaseExecutionStatus: not-authorized`, and `deploymentExecutionStatus: not-authorized`. Free prose or the words `not authorized` / `未核准` never satisfy an authorization key.

From the parent workspace, validate unique anchored fields and recompute every authorized document hash before creating anything:

```bash
ATLAS_DECISION_FILE="docs/decisions/2026-08-06-atlas-bootstrap.md"
ATLAS_SPEC_FILE="docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md"
ATLAS_CONTROLLER_FILE="docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-execution-index.md"
ATLAS_PLATFORM_PLAN_FILE="docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-platform-foundation.md"
test -f "$ATLAS_DECISION_FILE"
for ATLAS_DECISION_KEY in decisionSchemaVersion redTeamSpecStatus g0ExecutionStatus authorizedScope authorizedBy authorizedAt sourceDiscoveryExecutionStatus medicalAuthoringExecutionStatus hostingExecutionStatus publicReleaseExecutionStatus deploymentExecutionStatus specSha256 executionIndexSha256 platformPlanSha256; do
  test "$(rg -c "^${ATLAS_DECISION_KEY}:" "$ATLAS_DECISION_FILE")" -eq 1
done
test "$(rg -c '^decisionSchemaVersion: 1$' "$ATLAS_DECISION_FILE")" -eq 1
test "$(rg -c '^redTeamSpecStatus: confirmed$' "$ATLAS_DECISION_FILE")" -eq 1
test "$(rg -c '^g0ExecutionStatus: authorized$' "$ATLAS_DECISION_FILE")" -eq 1
test "$(rg -c '^authorizedScope: local-git-and-platform-foundation-only$' "$ATLAS_DECISION_FILE")" -eq 1
test "$(rg -c '^authorizedBy: [^[:space:]]([^[:cntrl:]]*[^[:space:]])?$' "$ATLAS_DECISION_FILE")" -eq 1
test "$(rg -c '^authorizedAt: [0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' "$ATLAS_DECISION_FILE")" -eq 1
for ATLAS_CLOSED_KEY in sourceDiscoveryExecutionStatus medicalAuthoringExecutionStatus hostingExecutionStatus publicReleaseExecutionStatus deploymentExecutionStatus; do
  test "$(rg -c "^${ATLAS_CLOSED_KEY}: not-authorized$" "$ATLAS_DECISION_FILE")" -eq 1
done
test "$(rg -c '^specSha256: [0-9a-f]{64}$' "$ATLAS_DECISION_FILE")" -eq 1
test "$(rg -c '^executionIndexSha256: [0-9a-f]{64}$' "$ATLAS_DECISION_FILE")" -eq 1
test "$(rg -c '^platformPlanSha256: [0-9a-f]{64}$' "$ATLAS_DECISION_FILE")" -eq 1
ATLAS_RECORDED_SPEC_SHA="$(sed -n 's/^specSha256: //p' "$ATLAS_DECISION_FILE")"
ATLAS_RECORDED_CONTROLLER_SHA="$(sed -n 's/^executionIndexSha256: //p' "$ATLAS_DECISION_FILE")"
ATLAS_RECORDED_PLATFORM_SHA="$(sed -n 's/^platformPlanSha256: //p' "$ATLAS_DECISION_FILE")"
test "$ATLAS_RECORDED_SPEC_SHA" = "$(shasum -a 256 "$ATLAS_SPEC_FILE" | awk '{print $1}')"
test "$ATLAS_RECORDED_CONTROLLER_SHA" = "$(shasum -a 256 "$ATLAS_CONTROLLER_FILE" | awk '{print $1}')"
test "$ATLAS_RECORDED_PLATFORM_SHA" = "$(shasum -a 256 "$ATLAS_PLATFORM_PLAN_FILE" | awk '{print $1}')"
test ! -e professional-sports-injury-atlas
```

Expected: all exit `0`. If a field is missing/duplicated, scope is not exact, any recorded hash differs from the current bytes, or any command fails, stop without creating the directory.

- [ ] **Step 2: Create the exact authorized project directory**

From the parent workspace:

```bash
mkdir professional-sports-injury-atlas
test -d professional-sports-injury-atlas
```

Expected: both exit `0`; `mkdir` must fail rather than merge if the target unexpectedly exists.

- [ ] **Step 3: Create all bootstrap text files with `apply_patch`**

`package.json` must contain the exact dependency table above and these scripts:

```json
{
  "scripts": {
    "dev": "ATLAS_BUILD_MODE=review astro dev",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check": "astro check --minimumFailingSeverity warning",
    "content:check": "tsx scripts/check-content.ts",
    "test:unit": "vitest run",
    "test:coverage": "vitest run --coverage",
    "build:review": "ATLAS_BUILD_MODE=review astro build",
    "preview": "astro preview",
    "test:e2e": "playwright test",
    "test:lighthouse": "tsx scripts/run-lighthouse.ts",
    "plan:verify": "tsx scripts/verify-plan-binding.ts",
    "plan:bind": "tsx scripts/bind-authority-document.ts",
    "plan:assert-authorized": "tsx scripts/assert-plan-authorized.ts",
    "plan:resolve": "tsx scripts/resolve-active-plan.ts",
    "plan:decision:verify": "tsx scripts/validate-plan-execution-decision.ts",
    "rtp:import": "tsx scripts/import-rtp-catalog.ts",
    "external:verify": "tsx scripts/verify-external-sources.ts",
    "brand:verify": "tsx scripts/verify-brand-assets.ts",
    "review-set:generate": "tsx scripts/generate-review-set.ts",
    "verify:review-artifact": "tsx scripts/verify-review-artifact.ts",
    "release:public": "ATLAS_BUILD_MODE=public tsx scripts/release-check.ts && ATLAS_BUILD_MODE=public astro build && ATLAS_BUILD_MODE=public tsx scripts/verify-public-artifact.ts",
    "verify": "npm run plan:verify && npm run format:check && npm run check && npm run content:check && npm run test:coverage && npm run build:review && npm run test:e2e && npm run test:lighthouse && npm run brand:verify && npm run verify:review-artifact"
  }
}
```

Also set `"private": true`, `"type": "module"`, and `"engines": {"node": ">=24.14.0 <25"}`.

`astro.config.mjs` must set `output: 'static'`, `trailingSlash: 'always'`, and must not add an SSR adapter, sitemap integration, analytics, or remote image domain.

`.node-version` contains exactly `24.14.0`. `.gitignore` covers `node_modules/`, `dist/`, `.astro/`, `coverage/`, `playwright-report/`, `test-results/`, `artifacts/external-verification.v1.json`, `artifacts/lighthouse-review.json`, and all `.env*` except `.env.example`.

`.prettierignore` contains `docs/superpowers/**`, `docs/decisions/**`, `src/data/generated/*.json`, `src/data/governance/course-link-decisions/*.json`, `src/data/governance/video-rights-decisions/*.json`, `schemas/*.json`, `research/source-manifests/*.json`, `research/source-manifest-registry.v1.json`, `research/reviews/source-batches/*.json`, `research/verification/*.json`, `public-release-history/*.json`, `public-release-artifacts/**/*.json`, and `review/**/*.json`. Authority snapshots/decisions remain byte-identical, and the binding plus other machine artifacts remain canonical compact JSON whose exact bytes are validated by their dedicated tools/tests. Human-authored JSON outside these paths remains formatted by Prettier.

`vitest.config.ts` uses the Node environment, includes `tests/unit/**/*.test.ts`, explicitly includes `src/lib/**/*.ts` for coverage, and enforces 90% statement/branch/function/line coverage for `src/lib/cases/**`. `playwright.config.ts` uses `webServer.url`, builds the review artifact before preview, and defines Chromium, Firefox, WebKit, and one mobile Chromium project.

Create the exact docs directories, copy the five parent authority files byte-for-byte, verify each with `cmp -s`, then use `apply_patch` to write `plan-binding.v1.json`. Every entry records document type, repository path, measured SHA-256, `boundAt`, and an `executionAuthorization` object. The approved spec/controller are non-executable authority. The platform entry uses role/scope/closed scopes declared in its header and is `authorized` only when the already validated bootstrap decision digest is bound. The source-discovery entry uses role `nba-injury-case-source-discovery`, scope `nba-source-discovery-only`, required closed scopes `medical-content-authoring`, `private-hosting`, `public-release`, `deployment`, and begins `not-authorized`. No plan/spec content is reformatted during copying.

```bash
mkdir -p docs/decisions docs/superpowers/plans docs/superpowers/specs
cp ../docs/decisions/2026-08-06-atlas-bootstrap.md docs/decisions/
cp ../docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md docs/superpowers/specs/
cp ../docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-execution-index.md docs/superpowers/plans/
cp ../docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-platform-foundation.md docs/superpowers/plans/
cp ../docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md docs/superpowers/plans/
cmp -s ../docs/decisions/2026-08-06-atlas-bootstrap.md docs/decisions/2026-08-06-atlas-bootstrap.md
cmp -s ../docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md
cmp -s ../docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-execution-index.md docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-execution-index.md
cmp -s ../docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-platform-foundation.md docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-platform-foundation.md
cmp -s ../docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md
```

`verify-plan-binding.ts` recomputes every repository snapshot hash from `plan-binding.v1.json` and requires every controlled file under `docs/superpowers/specs/`, `docs/superpowers/plans/`, and `docs/decisions/` (except the binding file itself) to appear exactly once. It fails on an absent, unbound-extra, duplicate, or changed document and does not require the non-Git parent in a later clean clone.

`bind-authority-document.ts` is the only append/update path. A newly written follow-on plan is bound in the same commit with a stable role, exact `executionScopeId`, sorted exact `requiredClosedScopeIds`, `lifecycle='active'`, and `executionAuthorization.status='not-authorized'`. The scope IDs are declared in that plan and become part of its document digest; they are never supplied ad hoc only at authorization time.

Every later authorization uses a date-stamped strict JSON `PlanExecutionDecisionV1`, not free prose. Its only keys are `schemaVersion: 1`, `decisionType: 'plan-execution'`, `executionStatus: 'authorized'`, exact `role`, repository-relative `planPath`, current `planSha256`, exact `executionScopeId`, sorted exact `closedScopeIds`, trimmed non-empty `authorizedBy`, and UTC `authorizedAt`. A duplicate-key-detecting parser rejects duplicate/unknown/missing fields, denial or ambiguous status, blank identity, malformed time, wrong role/path/hash/scope, and missing or extra closed scope. The executor may create this file only after the user authorizes that displayed plan digest and scope. `plan:decision:verify --decision <path> --plan <path>` is a preflight: it validates schema/scope and prints the measured decision digest but does not require an already bound decision.

After preflight, `plan:bind` rereads the same decision path, validates again, hashes those bytes and atomically writes both the decision binding and matching plan `authorized` transition; it fails without modifying the binding if bytes changed or either validation fails. Only the post-bind `assert-plan-authorized.ts <plan-path>` requires the decision path/digest to be bound and reparses/recomputes plan plus decision hashes every time. A revised replacement first marks the old role entry `superseded`, and only one active entry may exist per role. `resolve-active-plan.ts <role>` prints exactly one active bound path or fails. Agents never infer authorization from the presence of a plan, free text, a denial file, or an earlier gate.

`tests/unit/plan-binding.test.ts` uses a temporary fixture tree and covers changed/missing/unbound-extra/duplicate documents, two active plans for one role, unauthorized assertion, missing or digest-mismatched decision, valid authorization, exact active-plan resolution, and an append-only superseding transition. Decision fixtures additionally cover denial/ambiguous status, duplicate/unknown keys, whitespace identity, wrong plan/role/hash/scope, missing/extra closed scopes, bytes changed between preflight/bind, half-applied write rollback, and stale post-bind decision bytes. It never mutates the real authority files.

- [ ] **Step 4: Install exact dependencies and initialize local Git**

```bash
cd professional-sports-injury-atlas
ATLAS_NODE_BIN="/Users/ethanwu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
export PATH="$ATLAS_NODE_BIN:$PATH"
node --version
npm install
npx playwright install chromium firefox webkit
git init -b main
npm run plan:assert-authorized -- docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-platform-foundation.md
git status --short
```

Expected: `node --version` is exactly `v24.14.0`, installation exits `0`, and Git reports only the new project files. The PATH prefix uses the read-only Node runtime already bundled in this Codex workspace; do not generate the lock with the shell's Node 26.

- [ ] **Step 5: Run the minimal scaffold checks**

```bash
npm run format
npm run format:check
npm run test:unit -- tests/unit/plan-binding.test.ts
npm run plan:verify
npm run check
npm run build:review
```

Expected: all exit `0`; `dist/index.html` exists.

- [ ] **Step 6: Commit only the isolated project bootstrap**

```bash
git add .node-version .gitignore .prettierignore README.md package.json package-lock.json astro.config.mjs tsconfig.json prettier.config.mjs vitest.config.ts playwright.config.ts src/pages/index.astro scripts/verify-plan-binding.ts scripts/bind-authority-document.ts scripts/assert-plan-authorized.ts scripts/resolve-active-plan.ts scripts/validate-plan-execution-decision.ts tests/unit/plan-binding.test.ts docs/decisions docs/superpowers
git diff --cached --check
git commit -m "chore: bootstrap injury atlas"
```

### Task 1: Define strict case, taxonomy, update, and site contracts

**Files:**

- Create: `src/lib/contracts/case.ts`
- Create: `src/lib/contracts/taxonomy.ts`
- Create: `src/lib/contracts/update.ts`
- Create: `src/lib/contracts/injury-overview.ts`
- Create: `src/lib/contracts/release-history.ts`
- Create: `public-release-history/public-release-history.v1.json`
- Create: `src/lib/contracts/source-manifest-registry.ts`
- Create: `research/source-manifest-registry.v1.json`
- Create: `src/lib/contracts/site-governance.ts`
- Create: `src/lib/contracts/cross-validation.ts`
- Create: `src/content.config.ts`
- Create: `src/data/taxonomy/injuries.ts`
- Create: `src/data/taxonomy/sports.ts`
- Create: `src/data/taxonomy/leagues.ts`
- Create: `src/data/taxonomy/competitions.ts`
- Create: `src/data/taxonomy/mechanisms.ts`
- Create: `src/data/taxonomy/video-providers.ts`
- Create: `tests/fixtures/cases/valid-medical-review.json`
- Create: `tests/fixtures/cases/valid-approved-classic.json`
- Create: `tests/fixtures/injuries/valid-medical-review.json`
- Create: `tests/fixtures/updates/valid-baseline.json`
- Create: `tests/fixtures/research/source-manifests/FICTIONAL-SOURCE-2026-08-06-001.v1.json`
- Create: `tests/fixtures/research/reviews/source-batches/FICTIONAL-SOURCE-2026-08-06-001-source-review-decision.v1.json`
- Create: `tests/fixtures/research/source-manifest-registry.v1.json`
- Create: `tests/unit/case-schema.test.ts`
- Create: `tests/unit/case-cross-validation.test.ts`
- Create: `tests/unit/taxonomy.test.ts`
- Create: `tests/unit/update-schema.test.ts`
- Create: `tests/unit/injury-overview-schema.test.ts`
- Create: `tests/unit/release-history-schema.test.ts`
- Create: `tests/unit/source-manifest-registry.test.ts`

- [ ] **Step 1: Write failing contract tests**

Tests must first import the missing schemas and assert:

1. the two valid fixtures parse;
2. unknown fields fail because every object is strict;
3. arbitrary iframe HTML, HTTP URLs, stored thumbnail URLs, provider/host/embed mismatch, any primary `video.contentType` other than `in-game-injury-event`, missing/stale immutable source-batch/registry binding, any drift between bound candidate facts and the frozen origin entry, unknown injury/league/competition/mechanism tokens, malformed dates, invalid segment ranges, duplicate source IDs, duplicate case IDs/slugs, and filename-to-slug mismatch fail;
4. a recent approved case without a first-party diagnosis source fails;
5. a pre-cutoff classic case without reason or proposer fails at every status; proposer identity/list membership must match the frozen source-review decision, and an approved classic without an exception approver matching its medical reviewer fails; diagnosis passes with at least one first-party source, and only a classic whose bound source audit contains structured `documented-unavailable` first-party evidence may instead pass with at least two secondary sources from distinct publisher groups that do not share the same non-null syndicated origin;
6. professional claims with missing/unknown/unused evidence, wrong support path, duplicate claim ID, field text not exactly covered by ordered atomic claims, or aggregate evidence union mismatch fail;
7. `approved` with unconfirmed/conflicted diagnosis, pending source provenance, unavailable video, incomplete reviewer fields, or malformed digest fails; an approved medical fixture may still have public rights review not requested;
8. NBA paired with a sport other than basketball, an event date outside its declared NBA season, or an unknown competition fails;
9. mechanism registry aliases are unique, unknown/diagnostic-style tags fail, and `unclear` cannot be combined with another tag.
10. quarterly update ID/period mismatch, duplicate or missing case references, incorrect retired/unavailable state, and malformed/incomplete approved review fields fail.
11. injury overview unknown fields, unsupported injury, unlinked prose, incomplete evidence, copied prescription-like progression tables, stale digest, or missing review fields fail;
12. release-history chain gaps, duplicate release/update IDs, tampered snapshot digests or source-binding tuples, changed historical entries, missing/malformed site-publication-decision/build-commit/public-renderer/artifact/served-receipt/URL digests, or a nonempty first-release predecessor fail; append validation also fails changed prior bytes, wrong anchored prior-file digest, more than one appended entry, replacement/removal/reordering, or predecessor/base mismatch. A release-A → correction-supersedes-A fixture proves the current selector rejects A's old binding while historical A still validates only from its exact snapshot tuple and immutable release-commit artifacts; missing/tampered old manifest/entry/decision bytes fail.
13. source-manifest registry rejects unknown/duplicate keys, duplicate manifest IDs/paths/digests, paths outside the two allowed source-batch directories, noncanonical ordering, changed prior entries, malformed/unresolvable or multiply superseded references, a correction without exactly one matching replacement entry per reference, manifest/decision digest mismatch, or any attempt to reuse an old path; append validation requires the exact trusted previous canonical bytes and digest, preserves that complete entry prefix byte-for-byte, and appends exactly one terminal entry. Cross-batch active-set tests reject a quarterly duplicate of an existing candidate ID, event identity, or canonical video URL; only an exact correction replacement may reuse the superseded record's identity. A case that still binds a superseded origin fails approved/public selection until it is rebound and medically re-reviewed, retired, or recorded unavailable in the current update.

The valid case fixtures resolve only against the visibly fictional source-batch trio under `tests/fixtures/research/`. Tests copy that fixture subtree into a temporary repository root so its logical paths are the production-shaped `research/source-manifests/**`, `research/reviews/source-batches/**`, and registry path; they recompute every digest and never write fictional manifest bytes into the real `research/` authority directories. Production loaders reject fixture paths and test-only adapters.

Run:

```bash
npm run test:unit -- tests/unit/case-schema.test.ts tests/unit/case-cross-validation.test.ts tests/unit/taxonomy.test.ts tests/unit/update-schema.test.ts tests/unit/injury-overview-schema.test.ts tests/unit/release-history-schema.test.ts tests/unit/source-manifest-registry.test.ts
```

Expected: failure because contract modules do not exist.

- [ ] **Step 2: Implement exact single-entry schemas**

`caseSchema` is a `z.strictObject()` with these top-level keys only:

```text
schemaVersion, id, slug, status, sourceManifestBinding, sport, league, competition,
athlete, teamAtEvent, season, eventDate, opponent,
injury, observedMechanismTags, isClassic, classicReason,
classicProposedBy, classicExceptionApprovedBy, video, general, professional,
sources, review, audit
```

`video` contains only:

```text
provider, contentType, eventBinding, canonicalUrl, uploaderName, uploaderProvenance,
embedStatus, embedCheckedAt, durationSeconds, startSeconds,
endSeconds, fallbackUrl, sourceProvenanceVerification,
captionStatus, captionCheckedAt, publicRightsReview, segments
```

`sourceManifestBinding` contains the frozen `candidateId`, immutable origin `manifestId`, origin batch-manifest SHA-256, canonical entry SHA-256, that batch's source-review-decision SHA-256, and source-policy version. The append-only source-manifest registry resolves the exact manifest/decision paths and digests. Cross-validation loads those immutable artifacts, requires all digests to match, and compares case/event/competition, diagnosis, canonical primary video/original external-link identity, uploader/provenance, event binding, source metadata and classic proposal membership to the bound entry.

Source manifests are immutable editions/batches, never a mutable all-time aggregate. A quarterly batch gets a new `manifestId` and registry entry; adding it does not alter any old case binding or clinical digest. A correction creates a new batch entry with an explicit `supersedes` reference to the old manifestId/candidateId/entryDigest; only the affected case is rebound, medically re-reviewed and listed as updated. Deleting, overwriting or silently regenerating an old batch/decision/registry prefix fails. Medical authoring may add teaching evidence and clinical prose but cannot silently rewrite discovery facts.

`SourceManifestRegistryV1` is a duplicate-key-detected strict canonical JSON object with only `schemaVersion: 1` and `entries`. Each entry has exactly `manifestId`, `manifestPath`, `manifestDigest`, `sourceReviewDecisionPath`, `sourceReviewDecisionDigest`, `sourcePolicyVersion`, `batchType`, `period`, `createdAt`, `previousRegistryBytesDigest`, and sorted `supersedes[]` references containing `manifestId`, `candidateId`, and `entryDigest`. `batchType` is exactly `launch`, `quarterly`, or `correction`; `period` is ISO `YYYY-MM-DD` for `launch`/`correction` and `YYYY-qN` for `quarterly`. `supersedes[]` sorts by manifest ID, candidate ID, then entry digest. Manifest paths must be under `research/source-manifests/`; decision paths must be under `research/reviews/source-batches/`; both are immutable and unique. Entries sort by `createdAt`, then `manifestId`. The initial exact canonical bytes are `{"entries":[],"schemaVersion":1}`.

`source-manifest-registry.ts` exports `validateSourceManifestRegistry()`, `validateSourceManifestRegistryAppend(previousCanonicalBytes, next, expectedPreviousBytesDigest)`, `resolveSourceManifestBinding()`, and audit-only `resolveHistoricalSourceManifestBinding()`. Append validation hashes the exact trusted prior bytes from the previously finalized batch commit/handoff, requires the old entries to remain an exact prefix, requires exactly one appended terminal entry, rejects identifier/path/digest reuse, and verifies that every superseded reference resolves to an older immutable entry. The first append uses the exact canonical empty-registry bytes digest. A launch batch requires no supersedes; a quarterly batch may contain any number of newly passing cases, including zero, and has no supersedes; a correction batch must contain at least one exact supersedes reference, may contain only corrected/replacement entries, and must contain exactly one replacement entry with the same stable candidate ID and matching `supersedes` pointer for every referenced prior entry. One prior entry may be superseded at most once.

Registry artifact validation computes an active source-entry set across every registered manifest. Active candidate ID, athlete/date/opponent/competition event identity, and canonical video URL are globally unique; an exact correction moves the referenced prior entry out of the active set before admitting its replacement, while a quarterly duplicate fails. `resolveSourceManifestBinding()` resolves only active entries and fails closed on a superseded origin. `resolveHistoricalSourceManifestBinding()` may resolve an immutable superseded entry only for release-history validation or a current audit record that is `retired`/video `unavailable` and appears in the matching update; selectors and new approval decisions are forbidden from calling it. A superseded binding therefore cannot pass current medical/public selection: the case must bind the replacement, regenerate its clinical/video digests and receive a new medical decision, or transition to that bounded audit state. Historical release snapshots continue to validate against their immutable release-time artifacts and are not recomputed through the current active resolver. Per-injury 10-case, 30-total, recent-over-classic and classic-presence rules apply to the initial launch corpus and the current site-level selector, not to every later quarterly batch.

`sourceProvenanceVerification` contains `status`, `verifiedBy`, `verifiedAt`, `basis`, `notes`, nullable `verifiedPolicyVersion`, and nullable `reviewedVideoIdentityDigest`. Pending records use `null` for verifier/date/basis/version/digest. Verified records require the current source-policy version and a digest matching the pre-verification canonical video-identity payload; a policy or identity change returns the record to source verification.

`eventBinding` contains `status`, `eventSourceId`, `checkedBy`, `checkedAt`, and factual `basis`. Approval requires `status='verified'`; `eventSourceId` resolves to an `event-context` source, and the basis confirms athlete/date/opponent/competition identity without making a diagnosis. Checker identity/date are workflow fields, while status/source/basis are stable digest facts.

`publicRightsReview` contains `status`, `reviewedBy`, `reviewedAt`, `reviewedVideoDigest`, `policyVersion`, `termsCheckedAt`, `decisionBasis`, `notes`, `decisionPath`, and `decisionDigest`. `not-requested` uses null review/decision fields. `cleared` requires all fields, a digest matching the current canonical video-source payload, and a policy version matching current site governance; a policy/terms version change invalidates old clearance.

`PublicVideoRightsDecisionV1` is a later duplicate-key-detected strict canonical JSON artifact at `src/data/governance/video-rights-decisions/<case-id>.v1.json`. Its only fields are `schemaVersion: 1`, `decisionType: 'video-public-rights'`, `decisionStatus: 'cleared'`, exact `caseId`, current `videoSourceDigest`, `publicRightsPolicyVersion`, `termsCheckedAt`, non-empty `decisionBasis`, nullable `notes`, trimmed non-empty `reviewedBy`, and UTC `reviewedAt`. Applying it copies the exact fields and decision path/byte digest into `publicRightsReview`. `computePublicRightsDecisionDigest()` reparses/revalidates the artifact against the current case/video/policy and returns its canonical byte digest; the public selector/release gate reload the artifact every time. Record-local reviewer fields alone never clear rights.

For the MVP, `fallbackUrl` is not alternate media: it must equal the same canonical original platform page and is used only when the click-to-load embed is unavailable or captions are not verified. A second clip/source is rejected unless a later schema version models it as a fully independent video source with its own event binding, uploader provenance, caption/embed checks, policy verification, time window, rights review, discovery-manifest entry and external verification. `captionStatus='not-verified'` is allowed during review but never permits an in-site public embed; if every other public gate passes, rendering must degrade to the clearly labeled canonical external link.

`general` contains `whatHappened`, `whatIsVisible`, `whatVideoCannotProve`, and `confirmedUpdate`.

`professional` contains `mechanismAnalysis`, `clinicalLimitations`, `differentialContext`, `treatmentAndRtpMeaning`, `claims`, `evidenceIds`, and `rtpCourseKey`.

Each `claims[]` entry contains `id`, `field`, `text`, and non-empty `evidenceIds`. Claim IDs are globally unique. Claims are stored in render order; there is no unlinked prose outside the exact claim concatenation rule.

Each `sources[]` entry contains `id`, `type`, `title`, `publisher`, normalized `independenceGroup`, nullable `originReportId`, `url`, `publishedAt`, `accessedAt`, and non-empty controlled `supports: SourceSupportPath[]`. Classic independence checks use publisher group and syndicated origin rather than domain/name alone. Cross-validation enforces source-type/path compatibility and full professional-field coverage.

Compatibility is exact: `video-original` may support `general.whatHappened`, visible, and segment-observation paths; diagnosis sources may support confirmed diagnosis/update paths; `event-context` may support `general.whatHappened`; only `teaching-evidence` may support professional paths. Every atomic professional claim requires at least one supporting source whose ID is in both that claim's `evidenceIds` and the aggregate `professional.evidenceIds`.

`review` contains `status`, `reviewerName`, `reviewerQualification`, `reviewedAt`, and `reviewedContentDigest`; non-approved states use nullable identity/digest fields.

`audit` contains `createdAt`, `updatedAt`, and `sourceRecordId`.

`injuryOverviewSchema` is a strict object with `schemaVersion`, `injuryCode`, `status`, localized title/summary, `scope`, `basicAnatomyAndDefinition`, `commonObservedMechanisms`, `whatVideoCannotProve`, `diagnosisContext`, `treatmentContext`, `rtpContext`, atomic `claims`, `sources`, `review`, and `audit`. Every narrative field is reproduced exactly by ordered atomic claims with compatible `teaching-evidence` sources, using the same evidence-union rule as case professional content. It explicitly forbids individualized instructions, week-by-week prescriptions, dosage/progression tables, and copied RTP course units. `review.reviewedContentDigest` binds an overview-specific clinical payload and is nullable before approval.

`updateSchema` is also strict. Its top-level keys are:

```text
schemaVersion, id, period, status, summary, publishedAt,
addedCases, updatedCases, retiredCases, unavailableCases,
review, audit
```

`status` is exactly `draft`, `medical-review`, or `approved`; `review` has the same nullable-before-approval and complete-on-approval shape as a case review. `id` is `YYYY-q1` through `YYYY-q4`; `period` contains matching year/quarter/start/end dates. `publishedAt` is nullable review/release metadata: it remains null during G3/G5 medical review, is required as an exact UTC timestamp before public authorization, is included separately in the site/release snapshot, and becomes immutable after its first public release. It is not part of the medically reviewed update-content digest.

Every case transition stores clinical and video-source digests separately: `addedCases[]` contains `caseId`, `currentClinicalDigest`, and `currentVideoSourceDigest`; `updatedCases[]` contains both `previousClinicalDigest`/`currentClinicalDigest` and `previousVideoSourceDigest`/`currentVideoSourceDigest`, plus `reason`; `retiredCases[]` contains `caseId`, both previous digests and `reason`; `unavailableCases[]` contains `caseId`, both previous digests, both `currentClinicalDigest`/`currentVideoSourceDigest`, `detectedAt`, `previousEmbedStatus`, and `action`. Either clinical or provenance/embed/caption digest change is therefore expressible without pretending one changed when only the other did. IDs are unique across all four lists. The structure validator does not compare an old update against current-head cases.

`injuryOverviewSchema.status` uses the same exact three tokens. Its review object uses the same fields and approval completeness rules as case review. Both overview and update clinical payloads are explicit allowlists that exclude `status`, `review`, and `audit`; applying the matching durable medical decision therefore cannot change their reviewed digest.

`publicReleaseHistorySchema` stores an append-only `releases[]` hash chain. Each finalized release has `releaseId`, `releasedAt`, nullable `previousReleaseDigest`, exact `previousHistoryBytesDigest`, `siteDigest`, strict `sitePublicationDecisionDigest`, exact clean `buildCommit`, deterministic `publicRendererTreeDigest`, verified `deploymentArtifactDigest`, `servedArtifactReceiptDigest`, approved `publicUrlHash`, sorted `caseSnapshots[]`, sorted `injuryOverviewSnapshots[]`, sorted `updateSnapshots[]` (`updateId`, `updateDigest`, `publishedAt`), and `releaseDigest`. Every case snapshot stores `caseId`, `clinicalDigest`, `videoSourceDigest`, and the exact immutable release-time source tuple: `candidateId`, `manifestId`, `manifestDigest`, `entryDigest`, `sourceReviewDecisionDigest`, and `sourcePolicyVersion`. `releaseDigest` hashes the canonical release payload with only its own `releaseDigest` field omitted. The first release has no predecessor and uses the canonical empty-history bytes digest; every later release points to the exact previous `releaseDigest` and exact prior history-file bytes digest. Initial platform data is an empty history, not a fabricated release.

A later public-release plan first freezes `baseReleaseDigest` as the current terminal release digest (or null for the first release) and `baseHistoryBytesDigest` as the SHA-256 of the exact canonical history file from the previously finalized release commit/anchored release handoff (canonical empty history for the first release), then computes a candidate descriptor containing the authorized site digest and deterministic public-renderer/source-tree digest. It never trusts only the mutable working-tree copy. The public build may read that prior immutable history for validation and historical rendering, but its deterministic render projection is exactly prior release IDs/times/case/update availability snapshots plus the current candidate descriptor; it excludes prior artifact/URL audit fields and the not-yet-finalized new terminal record. The raw governance JSON is never copied to `dist`.

After the site-publication decision is applied and committed, the plan requires a clean worktree, verifies that the build commit's relevant source-tree digest still equals the authorized `publicRendererTreeDigest`, and builds once. An out-of-tree canonical public-dist manifest records every sorted `dist` path, byte length, SHA-256, expected content type and page/record identity; its digest is `deploymentArtifactDigest`. With redirects disabled, live verification requires every manifest path to return `200`, the expected content type and identity, matching decoded byte length/SHA, and the authorized public indexing contract: public HTML contains no noindex directive, `X-Robots-Tag` is not restrictive, and robots/sitemap behavior matches the release policy. A platform cryptographic deployment checksum may replace downloading/comparing every body only when it covers the identical full file set; it never replaces the full route/status/header/content-type/identity/indexing checks.

The strict served-artifact receipt records method, complete path count, zero byte/metadata mismatches, manifest/artifact digest, a canonical sorted response-metadata digest, public URL hash, provider deployment-ID hash, verifier and UTC time; its canonical digest becomes `servedArtifactReceiptDigest`. Response metadata includes path, status, redirect outcome, content type, decoded length/SHA or provider-checksum coverage, identity result, robots/indexing-header result and sitemap result. Credentials, raw HTML and media are not stored.

Only then may the plan finalize and append the release record whose `previousReleaseDigest`/`previousHistoryBytesDigest` equal the two frozen bases and whose `buildCommit`, artifact/receipt digests and URL hash match that verification. The live release is thereafter verified from this terminal record's stored site/decision/artifact/receipt tuple; appending it does not retroactively recompute its site digest against itself. The next candidate must advance both base digests to the new terminal/history bytes and obtain a new site-publication decision. Projecting the finalized terminal record yields the same public fields as the candidate descriptor, so a verification rebuild is byte-idempotent and does not create an append/build cycle. Failed, rebuilt, byte-mismatched, mutated or rolled-back deployments do not create a release record. Existing release objects are byte-for-byte immutable; only one new terminal release may be appended per authorized release commit.

A candidate release validates its current approved update against the last immutable public snapshot: added IDs must be absent previously and both current digests must match current head; updated previous digest pairs must match the prior snapshot and current pairs must match current head; retired IDs must exist in the prior snapshot with both previous digests matching, still exist as current `status='retired'` audit records with the same clinical/video digests, and be absent only from the new public case snapshot; unavailable IDs must exist in the prior snapshot with both previous digests matching, both current digests must equal the current unavailable record, and that record must be absent from the new public case snapshot. An unchanged prior-public case whose clinical or video-source head digest changed must be listed as updated. On the first release, one approved baseline update must list every public case under `addedCases` with both current digests and the other change lists must be empty. Historical updates are checked against their own recorded release snapshot, never rewritten to match current head.

- [ ] **Step 3: Implement registries and cross-record rules**

Initial active registries contain only:

```ts
sport: basketball
league: nba -> basketball
injuries: acl, ankle-sprain, achilles-rupture
competitions: nba-preseason, nba-regular-season, nba-play-in, nba-playoffs, nba-all-star
video providers: youtube, nba
```

`youtube` allows only `youtube.com`, `www.youtube.com`, and `youtu.be` and may use `verified` embed status. `nba` allows only `nba.com` and `www.nba.com` and may use only `external-link-only` or `unavailable`. A future broadcaster/provider is unavailable until its code, host allowlist, embed capability and tests are added.

The controlled observation-only mechanism registry initially contains:

```text
non-contact-cut, non-contact-landing, contact-at-knee,
hyperextension-visible, inversion-landing, contact-landing,
stepped-on-foot, push-off-acceleration, deceleration, unclear
```

Each entry has `code`, `labelZh`, non-empty `searchAliases`, and `allowedInjuries`. `unclear` cannot be combined with another tag. UI always labels these as visible-mechanism tags, never confirmed diagnosis.

The registry shapes already support adding another sport, competition and many leagues/providers. UI generation must filter by actual case count, so no empty MLB or football routes are emitted.

Export these pure functions:

```ts
validateCaseRecord(record: unknown): ValidationIssue[];
validateCaseCollection(records: InjuryCase[]): ValidationIssue[];
validateCaseApprovalPrerequisites(record: InjuryCase): ValidationIssue[];
validateInjuryOverview(record: unknown): ValidationIssue[];
validateUpdateStructure(update: QuarterlyUpdate): ValidationIssue[];
validateReleaseHistory(history: PublicReleaseHistory): ValidationIssue[];
validateHistoryAppend(previousCanonicalBytes: Uint8Array, nextHistory: PublicReleaseHistory, expectedPreviousBytesDigest: string): ValidationIssue[];
validateHistoricalReleaseSources(history: PublicReleaseHistory, registry: SourceManifestRegistryV1, loadArtifactAtCommit: ReleaseArtifactLoader): ValidationIssue[];
validateSourceManifestRegistry(registry: unknown): ValidationIssue[];
validateSourceManifestRegistryAppend(previousCanonicalBytes: Uint8Array, nextRegistry: SourceManifestRegistryV1, expectedPreviousBytesDigest: string): ValidationIssue[];
resolveSourceManifestBinding(registry: SourceManifestRegistryV1, binding: SourceManifestBinding): ResolvedSourceManifestBinding;
resolveHistoricalSourceManifestBinding(registry: SourceManifestRegistryV1, binding: SourceManifestBinding): ResolvedSourceManifestBinding;
```

`validateReleaseHistory()` verifies internal schema/hash-chain consistency. `validateHistoryAppend()` separately proves append-only continuity against exact canonical bytes loaded from the prior finalized release commit/anchored handoff: their SHA-256 must equal `expectedPreviousBytesDigest`, every old release must remain a byte-identical canonical prefix, exactly one new terminal entry may be added, and its predecessor must equal the old terminal/base head. `validateHistoricalReleaseSources()` never reads a current case. For each stored snapshot it uses that release's exact source tuple, `buildCommit`, the append-only registry and a read-only loader for immutable manifest/entry/decision bytes at that commit, then calls only the historical resolver and recomputes all digests. First release compares against the canonical empty-history bytes. Every issue has `{ code, path, message }`; validators collect all deterministic issues and never mutate input.

- [ ] **Step 4: Wire current Astro content collections**

`src/content.config.ts` uses `defineCollection()` plus `glob()` loaders for `src/content/cases/**/*.json`, `src/content/injuries/**/*.json`, and `src/content/updates/**/*.json`; import Zod from `astro/zod`. Routes later use `entry.id`, `getCollection()`, and `getEntry()`, not legacy `entry.slug` or `entry.render()`.

Keep all three content directories in Git with `.gitkeep`; do not add a real case, medical injury overview, or fake update entry.

- [ ] **Step 5: Turn tests green and export JSON Schema**

Add a unit test using `z.toJSONSchema(caseSchema)` and assert that it produces the required Draft 2020-12 shape. Task 2 exports the committed schema artifact with the shared canonical serializer; do not maintain a second handwritten schema.

```bash
npm run test:unit -- tests/unit/case-schema.test.ts tests/unit/case-cross-validation.test.ts tests/unit/taxonomy.test.ts tests/unit/update-schema.test.ts tests/unit/injury-overview-schema.test.ts tests/unit/release-history-schema.test.ts tests/unit/source-manifest-registry.test.ts
npm run check
```

Expected: all exit `0`.

- [ ] **Step 6: Commit the contract**

```bash
git add src/content.config.ts src/lib/contracts src/data/taxonomy src/content/cases/.gitkeep src/content/injuries/.gitkeep src/content/updates/.gitkeep public-release-history/public-release-history.v1.json research/source-manifest-registry.v1.json tests/fixtures/cases tests/fixtures/injuries tests/fixtures/updates tests/fixtures/research tests/unit/case-schema.test.ts tests/unit/case-cross-validation.test.ts tests/unit/taxonomy.test.ts tests/unit/update-schema.test.ts tests/unit/injury-overview-schema.test.ts tests/unit/release-history-schema.test.ts tests/unit/source-manifest-registry.test.ts
git diff --cached --check
git commit -m "feat: define injury case contract"
```

### Task 2: Implement canonical case digests, selectors, and review invalidation

**Files:**

- Create: `src/lib/cases/canonical-json.ts`
- Create: `src/lib/cases/digest.ts`
- Create: `src/lib/cases/selectors.ts`
- Create: `src/lib/cases/search-index.ts`
- Create: `src/lib/cases/review-validation.ts`
- Create: `src/lib/cases/update-digest.ts`
- Create: `src/lib/cases/injury-overview-digest.ts`
- Create: `src/lib/releases/history.ts`
- Create: `scripts/export-case-schema.ts`
- Create: `schemas/injury-case.v1.schema.json`
- Create: `tests/unit/case-digest.test.ts`
- Create: `tests/unit/case-selectors.test.ts`
- Create: `tests/unit/search-index.test.ts`
- Create: `tests/unit/update-digest.test.ts`
- Create: `tests/unit/injury-overview-digest.test.ts`
- Create: `tests/unit/release-transition.test.ts`

- [ ] **Step 1: Write digest and selector failures first**

Tests assert:

- key insertion order and Unicode composed/decomposed forms yield the same digest;
- changing general/professional text, a source URL/title/publisher/support path, diagnosis, uploader/provenance fact, or segment content/time changes the case digest;
- changing workflow `status`, medical `review`, classic proposer/approver identity, source/video checker identity/date, source `accessedAt`, embed/caption check state/date, `publicRightsReview`, `audit`, or CSS metadata does not change the case digest; changing the source-manifest binding or any bound discovery fact either changes its bound projection or fails cross-validation;
- changing the video URL/uploader/provenance/embed/canonical external fallback changes the video-identity/video-source digest and invalidates earlier provenance/rights decisions; changing only the current source-policy version makes the old provenance verification ineligible until rechecked and consequently invalidates public selection;
- `review.status='approved'` with an old digest is rejected immediately;
- review selector includes draft/source-verified/medical-review/approved and labels each state;
- medically approved selector includes only `status='approved'`, confirmed diagnosis, current source-manifest/provenance binding and matching medical digest, but deliberately does not require public-rights clearance, public external-freshness, indexing or a public URL;
- public selector includes only approved, confirmed, provenance-verified, currently playable or external-link-only records with matching medical digest and matching cleared public-rights digest; a public in-site embed additionally requires `captionStatus='available'`, while unavailable/not-verified captions force effective external-link-only rendering without excluding an otherwise eligible case;
- public selector excludes unavailable records from counts;
- search index contains only the records permitted by its selector.
- changing a quarterly change list/summary or either clinical/video digest in a transition changes its digest, while changing update `status`, `review`, `audit`, or nullable `publishedAt` does not; public validation binds `publishedAt` separately, and a wrong digest/timestamp in the current candidate release, a mismatch against that update's immutable historical snapshot, or a stale approved update digest fails.
- changing any injury-overview teaching text, claim, source or supports path changes its digest and invalidates old approval; changing its `status`, `review`, or `audit` fields does not.
- baseline, subsequent update, unchanged, retired and unavailable transitions validate against immutable prior release snapshots/current unavailable records; a previous/current clinical or video mismatch, missing history, changed old update, tampered chain/prefix, multi-entry append, or head change omitted from the current update fails.

Run the three test files and confirm failure on missing modules.

- [ ] **Step 2: Implement one canonicalization algorithm**

The algorithm recursively normalizes strings to NFC, preserves array order, sorts object keys by Unicode code point, serializes without insignificant whitespace, encodes UTF-8, and hashes exact bytes with SHA-256. Reject `undefined`, functions, symbols, non-finite numbers, Dates, Maps, Sets, and cyclic structures.

Export:

```ts
canonicalJson(value: unknown): string;
caseClinicalPayload(record: InjuryCase): CaseClinicalPayload;
computeVideoIdentityDigest(record: InjuryCase): string;
computeCaseContentDigest(record: InjuryCase): string;
computeVideoSourceDigest(record: InjuryCase): string;
computePublicRightsDecisionDigest(record: InjuryCase, decision: PublicVideoRightsDecision): string;
hasMatchingApprovedReview(record: InjuryCase): boolean;
hasMatchingPublicRightsClearance(record: InjuryCase): boolean;
validateCaseForApproval(record: InjuryCase): ValidationIssue[];
computeQuarterlyUpdateDigest(update: QuarterlyUpdate): string;
computeInjuryOverviewDigest(overview: InjuryOverview): string;
validateInjuryOverviewForApproval(overview: InjuryOverview): ValidationIssue[];
computePublicReleaseDigest(release: PublicReleaseSnapshot): string;
buildCandidateReleaseSnapshot(input: CandidateReleaseInput): PublicReleaseSnapshot;
validateQuarterlyUpdateAgainstRelease(update: QuarterlyUpdate, currentCases: InjuryCase[], previousRelease: PublicReleaseSnapshot | null, candidateRelease: PublicReleaseSnapshot): ValidationIssue[];
validateHistoricalUpdates(history: PublicReleaseHistory, updates: QuarterlyUpdate[]): ValidationIssue[];
validateHistoricalReleaseSources(history: PublicReleaseHistory, registry: SourceManifestRegistryV1, loadArtifactAtCommit: ReleaseArtifactLoader): ValidationIssue[];
validateHistoryAppend(previousCanonicalBytes: Uint8Array, nextHistory: PublicReleaseHistory, expectedPreviousBytesDigest: string): ValidationIssue[];
```

`caseClinicalPayload` is an explicit allowlist. It includes the bound origin manifest ID, candidate ID and entry digest; case/event/injury identity; observed mechanism tags; `isClassic` and `classicReason` but not proposer/approver identity; provider, `contentType`, canonical/fallback URL, uploader identity/provenance, duration, selected start/end and segments but not embed/caption/provenance check workflow; both content layers; and source ID/type/title/publisher/independenceGroup/originReportId/URL/publishedAt/support paths but not `accessedAt`. It excludes `status`, medical `review`, verifier identity/date, `video.publicRightsReview`, and `audit`; a separate cross-validator still requires the full immutable source-batch/registry binding to match.

`computeVideoIdentityDigest()` covers case/candidate identity, provider, `contentType`, event-binding facts, canonical/fallback URLs, uploader identity/provenance and duration/window, but excludes the provenance-verification object. A verified provenance record binds that pre-verification digest and the current source-policy version without a self-reference. `computeVideoSourceDigest()` then covers the identity payload plus embed state, caption state and source-provenance status/basis/policy/identity digest. It excludes verifier identity/date/notes, embed/caption checked dates, external freshness, and public-rights reviewer fields, so unchanged factual checks remain stable while policy/identity changes invalidate provenance and downstream rights clearance.

`validateCaseForApproval()` combines Task 1 approval prerequisites with `hasMatchingApprovedReview()`; this is the only approval validator used by selectors or release gates.

`buildCandidateReleaseSnapshot()` uses only the active source resolver and copies each selected case's exact validated source tuple into its immutable snapshot; it refuses a superseded or historical-only binding. `validateHistoricalReleaseSources()` later validates that stored tuple against release-time artifacts without consulting the current case head, so a correction can invalidate the current case without rewriting a prior release.

After canonicalization exists, `scripts/export-case-schema.ts` serializes `z.toJSONSchema(caseSchema)` with `canonicalJson()` and writes `schemas/injury-case.v1.schema.json`. A test regenerates to memory and requires exact equality with the committed artifact.

- [ ] **Step 3: Implement deterministic selectors**

```ts
selectReviewCases(records: InjuryCase[]): InjuryCase[];
selectMedicallyApprovedCases(records: InjuryCase[]): InjuryCase[];
selectPublicCases(records: InjuryCase[]): InjuryCase[];
groupCasesByInjury(records: InjuryCase[]): Map<InjuryCode, InjuryCase[]>;
buildClientSearchIndex(records: InjuryCase[]): ClientCaseIndexEntry[];
```

Sort by `eventDate` descending, then `slug` ascending. Tests prove a medically approved but rights-not-requested fixture is included only by `selectMedicallyApprovedCases()`, while a fully rights-cleared/current fixture is also included by `selectPublicCases()`. G5 counts use only the former; public gates use only the latter. Never let Astro components duplicate approval logic.

- [ ] **Step 4: Turn tests green and commit**

```bash
npm run test:unit -- tests/unit/case-digest.test.ts tests/unit/case-selectors.test.ts tests/unit/search-index.test.ts tests/unit/update-digest.test.ts tests/unit/injury-overview-digest.test.ts tests/unit/release-transition.test.ts
npx tsx scripts/export-case-schema.ts
npm run test:coverage
git add src/lib/cases src/lib/releases scripts/export-case-schema.ts schemas/injury-case.v1.schema.json tests/unit/case-digest.test.ts tests/unit/case-selectors.test.ts tests/unit/search-index.test.ts tests/unit/update-digest.test.ts tests/unit/injury-overview-digest.test.ts tests/unit/release-transition.test.ts
git diff --cached --check
git commit -m "feat: enforce per-case review digests"
```

Expected: all tests pass; branch and statement coverage for `src/lib/cases/**` are each at least 90%.

### Task 3: Import the existing RTP catalog through a read-only boundary

**Files:**

- Create: `src/data/professional-course-links.v1.json`
- Create: `src/data/generated/rtp-course-summaries.v1.json`
- Create: `src/lib/rtp/course-links.ts`
- Create: `src/lib/rtp/course-link-decision.ts`
- Create: `scripts/import-rtp-catalog.ts`
- Create: `tests/fixtures/rtp/`
- Create: `tests/unit/rtp-import.test.ts`
- Create: `tests/unit/course-links.test.ts`

- [ ] **Step 1: Write importer failure tests**

Fixtures cover matching catalog/manifest, wrong catalog SHA, non-canonical bytes, missing topic, duplicate mapping, changed source digest, any attempted output path outside the atlas project, upstream course medical/indexing status with missing identity/time/current-content digests or stale provenance, and strict course-link decisions with duplicate/unknown fields, stale catalog digest, wrong key/slug/URL/policy, blank approver, malformed time or tampered decision bytes.

Run and confirm failure because importer modules are absent.

- [ ] **Step 2: Define three explicit mappings**

`professional-course-links.v1.json` contains exactly:

| key | injuryCode | catalogSlug | scope note |
|---|---|---|---|
| `ankle-lateral-nonoperative` | `ankle-sprain` | `ankle-sprain-rehab-return-to-sport` | 急性、非手術、外側踝扭傷；不代表所有腳踝扭傷 |
| `acl-primary-reconstruction` | `acl` | `acl-reconstruction-rehab-return-to-sport` | 成人初次、單側、單純 ACL 重建術後；不代表所有 ACL 損傷 |
| `achilles-primary-repair` | `achilles-rupture` | `achilles-primary-repair-rehab-return-to-sport` | 成人急性中段斷裂初次手術修補後；不代表所有阿基里斯腱斷裂 |

Each mapping also has `linkApproval` with `status: 'pending'`, `approvedPublicUrl: null`, `approvedBy: null`, `approvedAt: null`, `approvedCatalogContentDigest: null`, `policyVersion: null`, `decisionPath: null`, and `decisionDigest: null`. Do not infer a URL from the catalog slug or populate approval fields without a durable decision.

`CourseLinkApprovalDecisionV1` is a duplicate-key-detected strict canonical JSON artifact stored later at `src/data/governance/course-link-decisions/<course-key>.v1.json`. Its only fields are `schemaVersion: 1`, `decisionType: 'course-link-approval'`, exact `courseKey`, `injuryCode`, `catalogSlug`, current `catalogContentDigest`, exact approved HTTPS `publicUrl`, current `linkPolicyVersion`, trimmed non-empty `approvedBy`, and UTC `approvedAt`. Applying it atomically copies the matching values plus decision path/byte digest into `linkApproval`. `course-links.ts`, the public CTA and release gate reload/reparse/rehash the artifact and require exact mapping/catalog/policy/URL/identity/time equality; record-local fields alone never qualify. A catalog content/policy/URL change returns the link to pending until a new named decision is obtained.

- [ ] **Step 3: Implement exact-byte manifest verification**

Default inputs are parent-relative:

```text
../artifacts/rtp/rtp-catalog.v1.json
../artifacts/rtp/rtp-catalog.v1.manifest.json
```

The importer computes SHA-256 from exact catalog bytes, compares `manifest.catalogSha256`, parses only after the digest matches, validates the full source against the pinned upstream `rtp-catalog.v1` schema, verifies schemaVersion/counts/sourceDigest and governance cross-field rules, selects the three exact slugs, and writes only `src/data/generated/rtp-course-summaries.v1.json` with canonical JSON. It does not convert a pending/stale upstream course into an approved summary.

Whitelist output fields:

```text
slug, contentDigest, titleZh, titleEn, subtitle, contentUpdatedAt,
taxonomy.primaryBodyRegion, taxonomy.structures, taxonomy.carePathway,
taxonomy.episode, patientSummary, appliesTo, keyExclusions, returnGoal,
searchAliases, governance.medicalReview.status,
governance.medicalReview.reviewer.id/name/qualification/profileUrl,
governance.medicalReview.reviewedAt, governance.medicalReview.approvedContentDigest,
governance.medicalReview.sourceReviewProvenance.algorithm/digest/scope,
governance.allowIndexing, governance.evidenceVerifiedAt,
governance.indexingAuthorization.status,
governance.indexingAuthorization.authorizedById/authorizedByName/authorizedAt,
governance.indexingAuthorization.approvedContentDigest/note
```

Do not import RTP videos, detailed units, treatment prescriptions, or source evidence into case records.

Private UI may show the imported title/scope with a disabled link. A public CTA requires a valid durable `CourseLinkApprovalDecisionV1` whose catalog content digest still matches, an approved reachable HTTPS URL and the site-governance `courseLinkPolicyVersion`. The imported course must independently satisfy upstream public eligibility: medical review is approved with complete reviewer ID/name/qualification/profile URL, reviewed time, source-review provenance and `approvedContentDigest === course.contentDigest`; `allowIndexing=true`; indexing authorization is authorized with complete authorizer ID/name/time and its own `approvedContentDigest === course.contentDigest`. A URL decision never substitutes for those course-content approvals. Any decision byte, course contentDigest/governance, URL or policy change fails closed until the relevant upstream or link approval is renewed.

- [ ] **Step 4: Run parent regression and atlas import**

From the parent workspace, using the existing pinned Python environment:

```bash
source .venv-rtp-catalog/bin/activate
python3 -c 'import importlib.metadata; assert importlib.metadata.version("jsonschema") == "4.25.1"'
make catalog-check
```

Expected: exit `0`; current source counts remain 7 topics, 52 units, 56 references, 79 evidence data, 16 videos.

From the atlas root, compute a parent-tree digest before and after import:

```bash
producer_digest_before=$(find ../artifacts/rtp ../course ../acl-reconstruction-rehab-return-to-sport/course ../achilles-primary-repair-rehab-return-to-sport/course ../adductor-strain-rehab-return-to-sport/course ../hamstring-strain-rehab-return-to-sport/course ../isolated-meniscus-repair-rehab-return-to-sport/course ../ucl-reconstruction-return-to-throwing/course ../schemas ../tools/rtp_catalog -type f -print | LC_ALL=C sort | while IFS= read -r producer_file; do shasum -a 256 "$producer_file"; done | shasum -a 256)
npm run test:unit -- tests/unit/rtp-import.test.ts tests/unit/course-links.test.ts
npm run rtp:import
producer_digest_after=$(find ../artifacts/rtp ../course ../acl-reconstruction-rehab-return-to-sport/course ../achilles-primary-repair-rehab-return-to-sport/course ../adductor-strain-rehab-return-to-sport/course ../hamstring-strain-rehab-return-to-sport/course ../isolated-meniscus-repair-rehab-return-to-sport/course ../ucl-reconstruction-return-to-throwing/course ../schemas ../tools/rtp_catalog -type f -print | LC_ALL=C sort | while IFS= read -r producer_file; do shasum -a 256 "$producer_file"; done | shasum -a 256)
test "$producer_digest_before" = "$producer_digest_after"
```

Expected: tests and import exit `0`; the final digest comparison exits `0`.

- [ ] **Step 5: Commit the read-only adapter**

```bash
git add src/data/professional-course-links.v1.json src/data/generated/rtp-course-summaries.v1.json src/lib/rtp scripts/import-rtp-catalog.ts tests/fixtures/rtp tests/unit/rtp-import.test.ts tests/unit/course-links.test.ts
git diff --cached --check
git commit -m "feat: import RTP course summaries"
```

### Task 4: Build site governance, review mode, and fail-closed public release

**Files:**

- Create: `src/data/site-governance.v1.json`
- Create: `src/lib/governance/build-mode.ts`
- Create: `src/lib/governance/site-digest.ts`
- Create: `src/lib/governance/release-gate.ts`
- Create: `src/lib/governance/review-set.ts`
- Create: `src/lib/governance/medical-review-decision.ts`
- Create: `src/lib/governance/video-rights-decision.ts`
- Create: `src/lib/governance/artifact-manifest.ts`
- Create: `src/lib/governance/served-artifact-receipt.ts`
- Create: `src/data/brand-asset-policy.v1.json`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/pages/robots.txt.ts`
- Create: `src/pages/review/[artifact].json.ts`
- Create: `ops/http-header-policy.v1.json`
- Create: `scripts/check-content.ts`
- Create: `scripts/release-check.ts`
- Create: `scripts/verify-review-artifact.ts`
- Create: `scripts/verify-public-artifact.ts`
- Create: `scripts/generate-review-set.ts`
- Create: `scripts/verify-brand-assets.ts`
- Create: `tests/unit/indexing-policy.test.ts`
- Create: `tests/unit/release-gate.test.ts`
- Create: `tests/unit/site-digest.test.ts`
- Create: `tests/unit/review-set.test.ts`
- Create: `tests/unit/artifact-manifest.test.ts`
- Create: `tests/unit/brand-assets.test.ts`

- [ ] **Step 1: Write negative release tests first**

Tests require public release failure for every independent condition:

1. `siteStatus` is not explicitly `public-approved` or `allowIndexing=false`;
2. indexing authorization or strict `SitePublicationDecisionV1` absent, malformed, unbound, denial/ambiguous, public/index booleans not both true, URL hash/site digest/identity/time mismatch, or decision-byte digest mismatch;
3. fewer than 10 public cases in any launch injury or fewer than 30 total;
4. fewer or more than one approved overview for any launch injury, an overview digest mismatch, or an overview still in draft/medical-review;
5. draft/source-verified/medical-review/conflicted/unavailable records in the public manifest;
6. missing/tampered/stale review-set manifest or durable medical-review decision; a decision list/digest/served-byte binding that differs from the current cases, three overviews or current update; or any applied status/reviewer/qualification/date/digest/classic-approver field that does not exactly match that decision;
7. case review digest or immutable origin manifest ID/batch/entry/source-review-decision/classic-proposal/registry binding mismatch, a modified old batch/registry prefix, or an untracked superseding correction;
8. source provenance absent, verified under a non-current source-policy version, bound to a stale video-identity digest, or external verification stale/failed/clinicalDigest/videoSourceDigest/exact `externalUrlSetDigest` mismatched (including any missing/extra/changed URL or expected identity); or strict per-case `PublicVideoRightsDecisionV1`/path/byte digest absent, duplicate/unknown/malformed/tampered, or case/video/policy/identity/time/basis mismatch;
9. `currentUpdateId` absent/ambiguous/unresolved, its QuarterlyUpdate not approved or digest-stale, `publishedAt` null/malformed/already changed after release, no rendered latest-update route/home link, or a baseline/subsequent transition whose clinical/video digest pairs do not match current cases and the last immutable public-release snapshot;
10. missing/tampered/noncontiguous public release history, null/wrong `baseReleaseDigest` or `baseHistoryBytesDigest`, changed non-append canonical prefix, a historical update/timestamp changed after its release, any stored historical case source tuple absent/tampered/unresolvable from its release commit, a dirty/non-recorded build commit, or build source-tree/public-renderer digest differing from the authorized/reviewed renderer digest;
11. null current `courseLinkPolicyVersion`, missing approved HTTPS course URL or strict `CourseLinkApprovalDecisionV1`, decision path/byte digest or mapping/catalog/current-policy/URL/identity/time mismatch, upstream course medical/indexing identity/date/current-content-digest mismatch, public site URL, privacy policy URL, or rights policy URL;
12. review-only route or noindex inconsistency in public output;
13. sitemap or analytics present in review output;
14. a current update exposes a non-public added/updated case, changes either digest of a prior case without listing it, or retires/marks unavailable a case absent from the last public release;
15. an NBA/league/team logo, local image asset, remote thumbnail, or endorsement-style identity appears in source or build output;
16. public output embeds a prerecorded video whose current `captionStatus` is unavailable or not verified instead of degrading it to a clearly labeled original external link.

Also assert a synthetic fully authorized fixture passes, proving the gate is achievable rather than hard-coded to fail.
Site-digest tests then change only the current approved update or `publishedAt`, one injury overview, review-set digest, medical-review-decision digest, one public-rights decision, one course-link approval, reviewed-content commit, public-renderer tree digest, or frozen candidate `baseReleaseDigest` and require the old `indexingAuthorization.authorizedSiteDigest` to fail in each case.

- [ ] **Step 2: Create a fail-closed governance record**

Initial `site-governance.v1.json` is:

```json
{
  "schemaVersion": 1,
  "siteStatus": "medical-review",
  "allowIndexing": false,
  "currentUpdateId": null,
  "currentReviewSetDigest": null,
  "medicalReviewDecisionDigest": null,
  "reviewedContentCommit": null,
  "publicRendererTreeDigest": null,
  "baseReleaseDigest": null,
  "baseHistoryBytesDigest": null,
  "publicSiteUrl": null,
  "privacyPolicyUrl": null,
  "rightsPolicyUrl": null,
  "publicRightsPolicyVersion": null,
  "courseLinkPolicyVersion": null,
  "indexingAuthorization": {
    "status": "not-requested",
    "authorizedBy": null,
    "authorizedAt": null,
    "authorizedSiteDigest": null,
    "decisionPath": null,
    "decisionDigest": null
  }
}
```

`siteStatus` is a controlled enum: `medical-review`, `private-approved`, or `public-approved`. `currentUpdateId` is the single explicit pointer used by homepage/latest-update routes and release checks; review mode may leave it null before real authoring, while private/public approved states require it to resolve to the matching approved update. G5 records the final canonical `currentReviewSetDigest`, matching durable `medicalReviewDecisionDigest`, and the review set's clean `reviewedContentCommit`; a later public plan records the deterministic `publicRendererTreeDigest` before requesting publication/indexing authorization. A successful medical review or private deployment may set at most `private-approved`.

`SitePublicationDecisionV1` is a separate duplicate-key-detected strict JSON artifact created only after the final candidate site digest and public URL are known. The public plan computes that candidate digest from an in-memory proposed governance projection with `siteStatus='public-approved'` and `allowIndexing=true` without first mutating the active private governance file. Its only fields are `schemaVersion: 1`, `decisionType: 'site-publication'`, `publicationStatus: 'authorized'`, exact `authorizedSiteDigest`, approved `publicUrlHash`, literal `allowPublic: true`, literal `allowIndexing: true`, trimmed non-empty `authorizedBy`, and UTC `authorizedAt`. The decision is added as a non-plan authority entry in `plan-binding.v1.json`, with exact path/byte digest but without changing any plan execution scope. After approval, one atomic patch binds the decision and applies the proposed governance fields plus indexing-authorization decision path/digest; recomputing the site digest must exactly equal the decision before any build. The release gate reloads and rehashes it, verifies site digest/URL/identity/time and both booleans, and rejects free prose, a plan-execution decision, denial/ambiguity, duplicate/unknown fields, partial application, or a stale/missing decision. Authorizing the public plan is not this site-level authorization, and neither one is a deployment instruction.

The site digest covers `siteStatus` and `allowIndexing`; the immutable `reviewedContentCommit` from the matching review set; deterministic `publicRendererTreeDigest`; a canonical sorted set of every public case-referenced source batch tuple (`manifestId`, manifest/decision digest and bound entry digest) validated through the append-only registry; canonical review-set digest and durable medical-review-decision digest; sorted public case ID + matching clinical digest + video-source digest + public-rights-decision digest tuples; the three approved injury-overview ID/digest pairs; the current approved update ID/digest/exact `publishedAt`; frozen `baseReleaseDigest` and `baseHistoryBytesDigest` (the terminal head/exact canonical history bytes at candidate authorization; initial release uses null head plus canonical empty-history digest); approved course URLs plus course-content governance projection and link-approval decision digests; public/policy URLs; current source-policy version; current non-null public-rights policy version; and current non-null `courseLinkPolicyVersion`. It excludes unreferenced future source batches, the indexing-authorization/publication-decision fields themselves to avoid self-reference, the later Git commit containing that decision, and the not-yet-built deployment artifact digest. Changing a referenced source edition, review provenance, URL/approval, update/timestamp, overview, source/policy, course content/governance, reviewed content, renderer tree or either candidate base invalidates the existing site-publication decision and indexing authorization; appending a new batch alone does not rewrite old case digests. The final release record separately captures the exact clean `buildCommit` whose relevant tree digest matched this authorization; the record's predecessor/history-prefix digest must equal both frozen bases.

`publicRendererTreeDigest` uses the exact same sorted tracked-path/byte algorithm and supporting-data projection as the final review-set `rendererTreeDigest`; public authorization requires equality with that reviewed digest. It precisely excludes clinical content JSON, site/link/rights workflow JSON, plan and review decisions/manifests, release history and volatile artifacts because those are bound by their dedicated clinical/site/base/decision digests. It does not permit a second vague “relevant files” allowlist. Any code/template/style/client script/route/build config/lockfile/taxonomy/course-scope projection change after G5 requires a new review build, served-review receipt and medical decision before public authorization.

`review-set.ts` builds a canonical manifest containing all review case IDs/full clinical digests and frozen origin source-entry bindings, a sorted unique set of every referenced immutable source-batch manifest/decision digest validated through the registry, three injury-overview digests, current update ID/digest, the clean pre-review content commit, a stable `contentAuthoritySnapshotDigest`, and a `rendererTreeDigest`. It never binds a mutable singular all-time manifest or unreferenced future batch. The content-authority snapshot is an explicit sorted projection of only the bound spec, controller, platform plan, every source-discovery plan that produced a referenced batch, and active authoring plan, including each document digest and any execution-decision digest required to reach G3. It excludes the mutable whole-file plan-binding digest and all future hosting/public roles, so appending or authorizing a later operational plan neither rewrites history nor invalidates a completed clinical review.

The renderer tree is computed from sorted path/byte-digest pairs for every Git-tracked implementation file under `src/**/*.{astro,ts,tsx,js,mjs,css}`, `public/**`, every build/verification `scripts/**/*.{ts,js,mjs}`, `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, and `playwright.config.ts`. Clinical JSON records are bound through their own canonical digests; plan/decision/review manifests, generated artifacts and workflow-only governance files are excluded by exact path. Supporting-data projections separately bind taxonomy, schemas, the sorted set of referenced immutable source-batch/decision/entry tuples plus only their exact registry entries, and course catalog key/title/scope/content digest. The full registry still undergoes independent append-only validation, but unreferenced future entries do not enter this digest; course URL/link-approval/indexing workflow fields are likewise excluded here and bound when relevant by content/site digests. Tests mutate at least one file in each page/layout/component/style/client-script/video/route/governance-code/build-script/config/lockfile/taxonomy/course-projection family and require a new renderer/supporting-data digest; no broad wildcard exclusion is allowed.

Case, overview and update clinical payloads explicitly exclude only their `status`, `review` and `audit` workflow fields, allowing the matching durable decision to be applied without a circular digest change. Both pre- and post-decision review builds refuse a changed authority snapshot, renderer/supporting data, source binding or clinical digest. `generate-review-set.ts` writes the manifest for a clean real G3 content commit; the review build serves exact canonical bytes at a review-only route and prints the overall review-set digest on every case/overview/update review page. A synthetic fixture proves the contract during foundation work; no real manifest is fabricated here.

`medical-review-decision.ts` validates a later durable decision containing named reviewer/qualification/date, exact review-set digest, private-dist manifest digest, strict served-review-artifact receipt digest, exact review-set response SHA-256, private URL hash, provider deployment-ID hash, and explicit per-case/per-overview/current-update ID/digest decisions plus classic exception approvals. It reloads the artifact manifest/receipt and requires complete path coverage, zero byte/metadata mismatches and matching deployment/URL/review-set identities; a fixture that changes one case HTML page while retaining the correct review-set JSON must fail. Only a hosting-specific plan may create/apply it after the complete served artifact is verified; agents cannot self-sign or infer approval. Applying it copies only the exact workflow fields represented in the decision. The public gate reloads the decision and review set, recomputes all decision/artifact digests, requires the complete selected IDs/digests to match, and compares every applied reviewer/status/classic-approver field to the durable decision; record-local approval fields alone are never sufficient.

`artifact-manifest.ts` defines one strict canonical sorted path contract shared by review and public modes. It rejects traversal/duplicate/missing/extra paths, a manifest that does not cover every built file exactly once, malformed SHA/length/content-type/identity metadata, and attempts to include its own out-of-tree manifest/receipt. `served-artifact-receipt.ts` validates full path-set coverage and a canonical response-metadata digest; provider checksum mode may replace body comparison only, never route/status/header/content-type/identity policy checks. Hosting/public plans persist canonical manifests and receipts under `review/**/*.json` or `public-release-artifacts/**/*.json`, containing hashes/metadata only and no credentials or raw copyrighted/clinical page bytes.

`brand-asset-policy.v1.json` declares text-only/CSS-geometry site identity and an empty league/team/image asset allowlist. `verify-brand-assets.ts` fails on any image file under `public/` or `src/assets/`, `<img>`/remote thumbnail or logo source in authored templates, logo/image URL fields in content, trademark-like asset filenames/alt/class names, or claims of official partnership/authorization. Plain editorial text such as `NBA` remains allowed with the independent-site disclaimer. Locally packaged font files remain allowed only through the pinned `@fontsource` imports; unavoidable branding inside an official third-party player is not altered or obscured.

- [ ] **Step 3: Implement build-mode behavior**

`ATLAS_BUILD_MODE` accepts only `review` or `public`; absent means `review`; any other value throws. Review mode:

- may render review selectors and status labels;
- emits `noindex,nofollow,noarchive,nosnippet,noimageindex` on every HTML page;
- emits robots `User-agent: *` plus `Disallow: /`;
- emits no sitemap, analytics, third-party iframe, or external preconnect;
- when a real G3 review-set manifest exists, serves its exact canonical bytes only at `/review/review-set.json` and shows case/overview/update IDs plus full digests in the review UI; public mode emits neither the route nor review metadata;
- must never be described as access-controlled until hosting verification exists.

Public mode uses only `selectPublicCases()` and runs `release-check.ts` before build. The release checker must call `validateHistoricalReleaseSources()` for every stored release before evaluating the current candidate; a missing loader, skipped historical-source result, or any issue is fatal. It uses snapshot tuples and immutable release-commit artifacts only, never substitutes a current case binding.

`src/pages/review/[artifact].json.ts` uses `getStaticPaths()` to emit only `{artifact: 'review-set'}` in review mode when a valid real/synthetic manifest is explicitly supplied; it returns no path in public mode. It responds with the already generated canonical byte string and `application/json`, never reparses/reformats it. At this task, create a minimal semantic `BaseLayout.astro` that emits the build-mode robots meta on every page and update `src/pages/index.astro` to use it. Task 5 enhances the same layout with the complete visual and preference system.

- [ ] **Step 4: Create deployment-neutral header policy**

`ops/http-header-policy.v1.json` declares the required review response header:

```json
{
  "schemaVersion": 1,
  "review": {
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex"
  }
}
```

The platform artifact verifier checks the policy file and HTML/robots behavior. It explicitly reports that HTTP delivery is `not-verified` until the later hosting plan sends a real request.

- [ ] **Step 5: Turn governance tests green**

```bash
npm run test:unit -- tests/unit/indexing-policy.test.ts tests/unit/release-gate.test.ts tests/unit/site-digest.test.ts tests/unit/review-set.test.ts tests/unit/artifact-manifest.test.ts tests/unit/brand-assets.test.ts
npm run content:check
npm run build:review
npx tsx scripts/verify-brand-assets.ts
npm run verify:review-artifact
```

Expected: all exit `0`; verifier reports no case data and `HTTP access/header delivery: not-verified` without calling it a pass.

Run the real negative gate separately:

```bash
set +e
npm run release:public
release_exit=$?
set -e
test "$release_exit" -ne 0
```

Expected: final `test` exit `0`, with deterministic messages for missing counts, URLs, course links, external verification, and authorization.

- [ ] **Step 6: Commit governance**

```bash
git add src/data/site-governance.v1.json src/data/brand-asset-policy.v1.json src/lib/governance src/layouts/BaseLayout.astro src/pages/index.astro src/pages/robots.txt.ts 'src/pages/review/[artifact].json.ts' ops scripts/check-content.ts scripts/release-check.ts scripts/generate-review-set.ts scripts/verify-brand-assets.ts scripts/verify-review-artifact.ts scripts/verify-public-artifact.ts tests/unit/indexing-policy.test.ts tests/unit/release-gate.test.ts tests/unit/site-digest.test.ts tests/unit/review-set.test.ts tests/unit/artifact-manifest.test.ts tests/unit/brand-assets.test.ts
git diff --cached --check
git commit -m "feat: add fail-closed release governance"
```

### Task 5: Implement the accessible sportsmedicine.tw-aligned design system

**Files:**

- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/styles/layout.css`
- Create: `src/styles/components.css`
- Modify: `src/layouts/BaseLayout.astro`
- Create: `src/components/layout/SiteHeader.astro`
- Create: `src/components/layout/SiteFooter.astro`
- Create: `src/components/layout/ThemeToggle.astro`
- Create: `src/components/layout/FontScaleControl.astro`
- Create: `src/components/layout/ReviewBanner.astro`
- Create: `src/scripts/preferences.ts`
- Create: `tests/unit/color-contrast.test.ts`
- Create: `e2e/helpers/a11y.ts`
- Create: `e2e/layout-accessibility.spec.ts`

- [ ] **Step 1: Write contrast and layout failures**

Unit tests parse CSS tokens and require WCAG AA contrast for every text/background pair. E2E tests require skip link, one `main`, visible keyboard focus, 44×44 controls, persisted manual theme, font scale range 0.875–1.5, 200% zoom without horizontal main-content scroll, and reduced-motion behavior. `e2e/helpers/a11y.ts` runs `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()` and fails on any violation; Task 6/7 specs reuse it after interactive states.

- [ ] **Step 2: Define exact brand tokens**

Use:

```css
--brand-500: #2288bb;
--brand-action: #00658d;
--ink-strong: #002b3c;
--surface-page: #f9fcfc;
--surface-info: #edf7fc;
--accent-500: #e77846;
--accent-ink: #002b3c;
--dark-page: #001e2b;
--dark-surface: #083747;
--dark-ink: #eaf7fa;
--dark-action: #7cc8e8;
--dark-accent: #f49a6c;
```

White text is forbidden on `--brand-500` because the pair is below 4.5:1. Use white on `--brand-action` and dark ink on the warm accent. Unit tests assert at least 4.5:1 for normal text and 3:1 for large text/non-text boundaries.

Import only required local font weights from the three pinned `@fontsource` packages. Use Barlow Condensed for display, Fraunces for headings, Inter plus PingFang TC／Microsoft JhengHei／Noto Sans CJK TC for body.

- [ ] **Step 3: Implement first-paint preferences and semantics**

BaseLayout initializes theme and font scale before body paint, defaults to light, supports manual dark mode, persists only local preferences, includes skip link, canonical metadata only when a public URL is authorized, and applies the review robots meta from the governance module.

Header/site identity is text-only. Footer and source-policy page state that the atlas is an independent educational site and is not affiliated with or endorsed by the NBA, teams, leagues or broadcasters; the wording does not imply legal clearance beyond the recorded per-source review.

Header mobile navigation supports `aria-expanded`, Escape close/focus return, and focus trap. Theme and font controls use `aria-pressed` or explicit labels and 44×44 targets.

- [ ] **Step 4: Turn tests green and commit**

```bash
npm run test:unit -- tests/unit/color-contrast.test.ts
npm run build:review
npm run test:e2e -- e2e/layout-accessibility.spec.ts
git add src/styles src/layouts src/components/layout src/scripts/preferences.ts tests/unit/color-contrast.test.ts e2e/helpers/a11y.ts e2e/layout-accessibility.spec.ts
git diff --cached --check
git commit -m "feat: add accessible atlas design system"
```

### Task 6: Implement privacy-enhanced video, timecode, and failure states

**Files:**

- Create: `src/lib/video/youtube.ts`
- Create: `src/lib/video/youtube-api-adapter.ts`
- Create: `src/lib/video/player-state.ts`
- Create: `src/components/cases/CaseVideo.astro`
- Create: `src/components/cases/CaseTimeline.astro`
- Create: `src/scripts/video-player.ts`
- Create: `src/pages/review/[lab].astro`
- Create: `tests/unit/youtube-url.test.ts`
- Create: `tests/unit/video-state.test.ts`
- Create: `e2e/video-player.spec.ts`

- [ ] **Step 1: Write URL, state, and browser failures first**

Test valid `youtube.com/watch?v=` and `youtu.be/` canonical URLs, reject playlists-only, channels, HTTP, arbitrary hosts, malformed IDs, injected query data, and provided iframe HTML. Verify provider/host/embed cross-rules, all three embed states, both caption outcomes, and registered NBA external-link-only behavior.

Browser tests on `/review/component-lab/` assert:

- initial DOM and network log contain no YouTube iframe/request, thumbnail URL, preconnect, autoplay, or tracker;
- a normal source anchor and timestamp anchors are present before enhancement and still work with JavaScript disabled;
- the first user click, and only then, creates one iframe whose `src` is the validated `https://www.youtube-nocookie.com/embed/{videoId}` URL, requests the official YouTube IFrame API, and passes that existing iframe element to one `YT.Player` instance; no undocumented `host` option is used;
- the no-cookie iframe URL includes `enablejsapi=1`, a runtime `origin` equal to the current page origin, and excludes autoplay; before insertion it receives an accessible title, `loading='lazy'`, and `referrerpolicy='strict-origin-when-cross-origin'`, and its host remains `youtube-nocookie.com` after API readiness;
- timeline enhancement calls the typed adapter's `seekTo()` after `onReady` and preserves the same player/iframe instance;
- the test intercepts the IFrame API and player routes with a deterministic local stub, and fails on any unmocked YouTube request;
- external-link-only renders a source link and no blank player;
- unavailable renders a clear unavailable notice and no player;
- available/unavailable/not-verified caption states are visibly labeled; available captions point readers to the original platform/player control, and no transcript is stored;
- public mode creates an in-site player only for `captionStatus='available'`; unavailable/not-verified captions render the clearly labeled original source link and written case notes but no embedded synchronized media. Review mode may expose the technical player state to the named reviewer while preserving the visible warning;
- keyboard focus moves predictably and returns on failure.

- [ ] **Step 2: Implement neutral click-to-load UI**

Do not use video screenshots or remote thumbnails. The initial card displays source title, uploader, duration, caption status, a warm-orange play symbol with dark text, a normal canonical source link, and a button. The component accepts only the already validated video contract; `buildPrivacyEnhancedEmbedUrl()` is available only to the registered YouTube provider. Registered non-YouTube providers render external-link-only UI.

After the user clicks, create a validated privacy-enhanced iframe with `src=https://www.youtube-nocookie.com/embed/{videoId}?enablejsapi=1&origin={encodedCurrentOrigin}` and no autoplay parameter, insert it once, then dynamically load `https://www.youtube.com/iframe_api`. Pass the existing iframe element to the official `YT.Player` constructor through a typed adapter using only documented `events.onReady`/`events.onError`; do not pass a `host` option or let the adapter create a replacement iframe. The iframe allow list excludes autoplay. Timeline links remain real source URLs; JavaScript intercepts them only when the player is ready and then calls `player.seekTo(seconds, true)`. If API load/readiness fails, remove the failed iframe and let the browser follow the original timestamp URL. Do not implement a raw `postMessage` player protocol.

- [ ] **Step 3: Make the component lab review-only**

`src/pages/review/[lab].astro` returns exactly one static path named `component-lab` in review mode and zero paths in public mode. It uses an in-memory fictional fixture and is absent from the public route manifest.

- [ ] **Step 4: Turn tests green and commit**

```bash
npm run test:unit -- tests/unit/youtube-url.test.ts tests/unit/video-state.test.ts
npm run build:review
npm run test:e2e -- e2e/video-player.spec.ts
git add src/lib/video src/components/cases/CaseVideo.astro src/components/cases/CaseTimeline.astro src/scripts/video-player.ts src/pages/review tests/unit/youtube-url.test.ts tests/unit/video-state.test.ts e2e/video-player.spec.ts
git diff --cached --check
git commit -m "feat: add click-to-load case video"
```

### Task 7: Build the injury atlas routes, dual-layer notes, and filters

**Files:**

- Create: `src/components/atlas/InjuryCard.astro`
- Create: `src/components/atlas/CaseCard.astro`
- Create: `src/components/atlas/CaseFilters.astro`
- Create: `src/components/atlas/EmptyState.astro`
- Create: `src/components/cases/LayeredNotes.astro`
- Create: `src/components/cases/ReviewBadge.astro`
- Create: `src/components/cases/RtpCourseLink.astro`
- Create: `src/components/injuries/InjuryOverview.astro`
- Create: `src/scripts/case-filters.ts`
- Create: `src/scripts/layered-notes.ts`
- Create: `src/lib/cases/pagination.ts`
- Create: `src/lib/routes/static-paths.ts`
- Create: `src/data/review-fixtures.ts`
- Modify: `src/pages/index.astro`
- Create: `src/pages/injuries/[injury].astro`
- Create: `src/pages/injuries/[injury]/page/[page].astro`
- Create: `src/pages/cases/[slug].astro`
- Create: `src/pages/leagues/[league].astro`
- Create: `src/pages/leagues/[league]/page/[page].astro`
- Create: `src/pages/updates/[quarter].astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/source-policy.astro`
- Create: `src/pages/case-index/manifest.json.ts`
- Create: `src/pages/case-index/[injury]/[page].json.ts`
- Create: `src/pages/review/fixtures/[fixture].astro`
- Create: `tests/unit/filtering.test.ts`
- Create: `tests/unit/pagination.test.ts`
- Create: `tests/unit/routes.test.ts`
- Create: `tests/unit/review-fixture-routes.test.ts`
- Create: `e2e/atlas-navigation.spec.ts`
- Create: `e2e/filtering.spec.ts`
- Create: `e2e/no-javascript.spec.ts`
- Create: `e2e/data-bearing-routes.spec.ts`

- [ ] **Step 1: Write route and enhancement tests first**

With empty real collections, tests require:

`src/data/review-fixtures.ts` contains only visibly fictional athlete/team/source names and a never-requested NBA-host external-link fixture; it contains no real player, team, diagnosis, media ID, medical assertion, or live request. It is accepted only by review-fixture adapters, never by public selectors.

- home shows the three injury atlas cards and a transparent `0 reviewed cases` state;
- the three injury routes exist and show useful injury/course scope information without fake cases;
- no MLB, football, or empty league route is generated;
- course cards show `課程連結待核准` and never guess a URL;
- review lab routes are marked as review-only;
- case, league, and update routes derive only from actual entries.
- pure route builders given one hermetic full fictional case, injury overview and baseline QuarterlyUpdate produce the expected case/league/update paths exactly once; review-only fixture paths render those same production view components, while public mode produces zero fixture/review paths;
- the fictional data-bearing review build renders a case detail, injury teaching overview, league listing, quarterly update and home latest-update link; source links, two-layer notes, video external/failure state, IDs and digests all remain present without JavaScript;
- classic cases always show the exact `經典案例` label and a readable classic reason;
- diagnosis confirmation status, confirmed update, and `畫面不能證明什麼` are separate from the private workflow `ReviewBadge`; review status never masquerades as diagnosis status;
- a 240-case synthetic collection produces 12-card HTML pages and 100-entry deferred index shards, with every permitted case present exactly once and no unbounded first-page DOM;
- `LayeredNotes` uses a native button group with two `<button type="button">` controls, unique `aria-controls`, one `aria-pressed=true` emphasis state, stable focus, and normal Enter/Space activation. Both controlled sections remain in DOM and readable; this is not a fake tab interface. E2E runs Axe before/after each state change, at 200% zoom, and with JavaScript disabled.

Filtering tests use fictional in-memory fixtures and cover athlete/team keyword, event year derived from `eventDate`, season, event year and season independently/together, sport, league, injury, controlled observed mechanism/aliases, classic, `injury.confirmationStatus`, workflow review status, each of those two statuses independently and together, compound filters, reset, and zero results. The two status controls use distinct labels and never substitute one meaning for the other.

- [ ] **Step 2: Implement injury-first static routes**

The home page contains injury cards, latest approved/review update state and route, search entry, source/review policy, and the three RTP mapping summaries. Injury pages render the matching injury-overview teaching sections and review digest, then a featured approved/review case only when one exists; before real overview authoring they render a transparent `傷種教學待審查` state rather than fabricated clinical copy. Case detail uses video left/notes right on desktop and video → general notes → timeline → professional notes → other cases on mobile. Case cards and details render the classic label/reason when applicable and keep external diagnosis confirmation visually distinct from private review workflow. Review pages visibly expose record ID, full content digest and overall review-set digest with a copyable text control.

General and professional layers are both present in server HTML. The labeled native button group toggles only visual emphasis, updates `aria-pressed` without moving focus, and never hides either controlled section; without JavaScript both sections remain normally ordered and readable.

- [ ] **Step 3: Implement progressive filtering without hiding no-JS content**

Build-time listing page size is exactly 12. `/injuries/{injury}/` and `/leagues/{league}/` are canonical page 1; additional static pages live under `/page/{n}/` with semantic previous/next links, so no-JavaScript browsing remains complete and every initial HTML DOM is bounded. Case detail related lists are capped at 3.

After the first filter interaction, JavaScript loads a minimal index manifest and only the needed 100-entry injury shards, applies compound filters, and renders 12 results at a time. Initial page load does not fetch index shards. Filter state updates the query string with `history.replaceState`, announces result counts via `aria-live`, and provides a one-action reset. Without JavaScript, static pagination and all core case/source pages remain readable; advanced compound filtering is the documented degradation.

Index shards contain only selector-permitted minimal fields, including derived `eventYear` and canonical season. Review-build shards expose diagnosis confirmation and private workflow review status as separate controlled fields; public shards never expose private workflow status and contain only cases already selected as externally confirmed. They contain no medical prose beyond card summaries and no arbitrary HTML. Public update selectors and historical rendering use the immutable public-release history: current added/updated cases must pass `selectPublicCases()`, while retired/unavailable entries resolve only against the immediately prior release snapshot and render non-clinical retirement/availability facts.

- [ ] **Step 4: Turn tests green and commit**

```bash
npm run test:unit -- tests/unit/filtering.test.ts tests/unit/pagination.test.ts tests/unit/routes.test.ts tests/unit/review-fixture-routes.test.ts
npm run build:review
npm run test:e2e -- e2e/atlas-navigation.spec.ts e2e/filtering.spec.ts e2e/no-javascript.spec.ts e2e/data-bearing-routes.spec.ts
git add src/components/atlas src/components/cases/LayeredNotes.astro src/components/cases/ReviewBadge.astro src/components/cases/RtpCourseLink.astro src/components/injuries src/scripts/case-filters.ts src/scripts/layered-notes.ts src/lib/cases/pagination.ts src/lib/routes src/data/review-fixtures.ts src/pages tests/unit/filtering.test.ts tests/unit/pagination.test.ts tests/unit/routes.test.ts tests/unit/review-fixture-routes.test.ts e2e/atlas-navigation.spec.ts e2e/filtering.spec.ts e2e/no-javascript.spec.ts e2e/data-bearing-routes.spec.ts
git diff --cached --check
git commit -m "feat: build injury atlas browsing experience"
```

### Task 8: Add external-source verification without coupling it to normal builds

**Files:**

- Create: `src/lib/external/verification.ts`
- Create: `scripts/verify-external-sources.ts`
- Create: `tests/unit/external-verification.test.ts`
- Create: `.env.example`

- [ ] **Step 1: Write mocked network tests**

Cover HTTP 200, redirect to a new canonical URL, 404, 429 with retry, timeout, DNS/network failure, YouTube API missing key, `status.embeddable=false`, title/uploader mismatch, stale results, and an otherwise fresh artifact whose current external URL set has one missing, extra or changed URL/expected identity. No unit test calls the live internet.

- [ ] **Step 2: Implement a bounded verifier**

Rules:

- default concurrency `2`, maximum `3`;
- timeout 15 seconds per attempt;
- at most 3 attempts with bounded exponential backoff;
- only HTTPS GET/HEAD requests to URLs already present in validated case data;
- optional YouTube Data API key read only from `YOUTUBE_API_KEY`;
- no oEmbed result is treated as rights or embeddability approval;
- for each case, derive `externalUrlSetDigest` from a canonical sorted projection of every current externally verified URL and its kind/source ID/expected title-uploader-publisher identity, covering primary/canonical external video, event/diagnosis/teaching sources and any allowed original-link fallback; duplicates normalize deterministically;
- output is `artifacts/external-verification.v1.json`, keyed by case ID + current `clinicalDigest` + `videoSourceDigest` + `externalUrlSetDigest`; each checked URL stores its URL hash, expected identity comparison and result, and validation rejects any missing/extra/changed current URL even if the artifact is under seven days old;
- standard `npm run build:review` performs no network requests;
- public release requires a complete exact-set matching successful result less than 7 days old.

- [ ] **Step 3: Turn mocked tests green**

```bash
npm run test:unit -- tests/unit/external-verification.test.ts
npm run build:review
```

Expected: both exit `0`; no live request is made. Do not run the live verifier until true source data exists.

- [ ] **Step 4: Commit verifier code, not volatile results or secrets**

```bash
git add src/lib/external scripts/verify-external-sources.ts tests/unit/external-verification.test.ts .env.example .gitignore
git diff --cached --check
git commit -m "feat: add bounded source verification"
```

### Task 9: Document operations and run the complete local gate

**Files:**

- Create: `docs/architecture.md`
- Create: `docs/content-contract.md`
- Create: `docs/operations/quarterly-curation-runbook.md`
- Create: `docs/reviews/2026-08-06-platform-foundation-review.md`
- Create: `scripts/run-lighthouse.ts`
- Modify: `README.md`

- [ ] **Step 1: Write durable documentation**

Architecture documents selector boundaries, per-case digest, site digest, review/public modes, RTP read-only import, and why noindex is not private. Content contract documents every enum, diagnosis rule, classic cutoff, rights rule, timecode rule, and source/evidence distinction.

Quarterly runbook uses the fixed order: discover → deduplicate → source verification → video verification → diagnosis verification → write two layers → validate → digest → named medical review → private QA → separately decide release. It includes unavailable-video replacement and conflicted-diagnosis rollback procedures.

- [ ] **Step 2: Implement and preflight the measurable performance gate**

`run-lighthouse.ts` starts `astro preview` on `127.0.0.1`, launches the Playwright Chromium executable through `chrome-launcher`, runs mobile Lighthouse against `/`, the three injury routes, `/review/fixtures/case-detail/`, and `/review/fixtures/latest-update/`, and always terminates preview/Chrome in `finally`. Before measuring, it asserts each fixture route has the expected atlas page identity so a fallback/404 cannot pass. It writes `artifacts/lighthouse-review.json` and exits nonzero if any Accessibility score is below `0.95` or any Largest Contentful Paint exceeds `2500ms`.

```bash
npx playwright install chromium firefox webkit
npm run build:review
npm run test:lighthouse
```

Expected: all exit `0`; local browser install/measurement does not deploy. This automated gate supplements, not replaces, keyboard/screen-reader/manual medical review.

- [ ] **Step 3: Run full positive verification**

```bash
npm ci
npm run rtp:import
npm run verify
```

Expected: all exit `0`. Verification includes plan binding, formatting, Astro/content checks, coverage, all Playwright/Axe projects, Lighthouse Accessibility/LCP budgets, and artifact policy. The review verifier reports HTML/robots noindex consistency, zero initial third-party embeds, no sitemap/analytics, and HTTP access/header delivery `not-verified` pending hosting.

- [ ] **Step 4: Run the public negative gate separately**

```bash
set +e
npm run release:public
public_release_exit=$?
set -e
test "$public_release_exit" -ne 0
```

Expected: final `test` exit `0`; deterministic failures name missing 30-case counts, approved URLs, external verification, and indexing authorization.

- [ ] **Step 5: Run security and placeholder scans**

```bash
if rg -n --hidden --glob '!node_modules/**' --glob '!package-lock.json' --glob '!docs/superpowers/**' '(API_KEY=.{8,}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|youtube\.com/embed/.{11})' .; then exit 1; fi
if rg -n --hidden --glob '!node_modules/**' --glob '!package-lock.json' --glob '!docs/superpowers/**' '(TODO|FIXME|TBD|lorem ipsum|example\.com)' src scripts docs ops tests e2e; then exit 1; fi
git status --short
git diff --check
```

Expected: the first two checks exit `0` with no matches; only the intended README and documentation files are uncommitted before the final commit; `git diff --check` exits `0`.

- [ ] **Step 6: Record exact evidence and commit**

The review file records Node/npm versions, lock hash, RTP manifest hash, every command/exit status, unit/coverage summary, Playwright browser matrix, expected public-gate failures, route list, no-deploy confirmation, and the explicit remaining gates: real sources, case authoring, medical review, access-controlled hosting, public authorization.

```bash
git add README.md docs scripts/run-lighthouse.ts
git diff --cached --check
git commit -m "docs: record atlas foundation verification"
git status --short
```

Expected: clean local `main` branch. No remote exists.

## Platform foundation completion criteria

- Local isolated Git repository exists only because G0 authorized it.
- Static review build and all unit/E2E/a11y checks pass with fictional fixtures only.
- Case schema, cross-validation, digest and selectors are frozen and tested.
- Injury-overview, immutable quarterly/release-history, review-set and medical-decision contracts are frozen and tested with fictional data only.
- Initial HTML never connects to YouTube; click-to-load and all failure states work.
- Three injury routes and course scope summaries work without guessed URLs.
- Hermetic review-only case/update routes prove data-bearing templates, latest-update linking, LayeredNotes state and no-JS behavior; public mode excludes every fixture route.
- Existing RTP catalog was imported read-only with exact-byte manifest verification.
- Review artifacts are noindex but explicitly not claimed private.
- Public release check is achievable in synthetic tests and fails against real empty data.
- Text-only brand asset policy rejects league/team logos, thumbnails and endorsement-style identity.
- No remote, deployment, DNS, analytics, public indexing, real case content, downloaded media, or invented reviewer was created.

## Official implementation references

- Astro installation and Node requirements: https://docs.astro.build/en/install-and-setup/
- Astro Content Collections: https://docs.astro.build/en/guides/content-collections/
- Astro static output: https://docs.astro.build/en/reference/configuration-reference/#output
- Astro testing with Vitest: https://docs.astro.build/en/guides/testing/
- Playwright web server: https://playwright.dev/docs/test-webserver
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing
- YouTube privacy-enhanced embed: https://support.google.com/youtube/answer/171780
- YouTube IFrame API: https://developers.google.com/youtube/iframe_api_reference
- YouTube Player parameters: https://developers.google.com/youtube/player_parameters
- YouTube Videos API status fields: https://developers.google.com/youtube/v3/docs/videos
