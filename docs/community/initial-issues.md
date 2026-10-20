# Initial contributor issues

Prepared and published on 2026-10-21 after checking all open and closed GitHub Issues; none existed before publication. The five issues below are open and unassigned follow-ups to [PR #4](https://github.com/keanu77/professional-sports-injury-atlas/pull/4). Their implementation is not part of that onboarding PR. Check each live issue for current status and coordinate its scope before starting. Only existing labels were applied; `good first issue` still requires a maintainer's commitment to help. See [label guidance](labels.md).

## 1. Add deterministic link and fragment checks for onboarding documents

Live issue: [#5](https://github.com/keanu77/professional-sports-injury-atlas/issues/5).

- **Problem:** The contributor workflow checks application artifacts but has no repeatable CI check for README/Fork Guide file links and heading anchors. This PR checks those links once; future edits can drift.
- **Expected outcome:** Broken local documentation references fail with a useful file/target message.
- **Implementation scope:** Limit the first pass to both READMEs, CONTRIBUTING, LICENSE-SCOPE, SECURITY, development/fork guides, and new community/promotion docs. Add a script, fixtures, and a CI step. Exclude frozen historical evidence and separate external HTTP checks from deterministic CI.
- **Acceptance criteria:** Valid relative paths/anchors pass; a missing file, missing heading, URL-encoded path, image link, and cross-document fragment have regression coverage. Reference-style Markdown links are supported. No live network request is required. No historical document is reformatted.
- **Suggested labels:** `documentation`, `help wanted`.
- **Difficulty:** Medium; Markdown parsing and GitHub heading normalization need care.

## 2. Add a Traditional Chinese companion to the fork guide

Live issue: [#6](https://github.com/keanu77/professional-sports-injury-atlas/issues/6).

- **Problem:** The detailed Fork Guide is mainly English, while the application and its principal medical-education audience use Traditional Chinese. The short Chinese overview does not translate every failure/release boundary.
- **Expected outcome:** Chinese-speaking contributors can follow the same tested setup and licensing distinctions.
- **Implementation scope:** Add `docs/fork-guide.zh-TW.md`, reciprocal language links, and a parity checklist. Preserve command blocks, file paths, and the demo/review/public distinction. Do not translate clinical records.
- **Acceptance criteria:** All ten onboarding topics in the English guide are present; commands run unchanged; counts and rights statements agree; relative links resolve; a bilingual reviewer checks terminology.
- **Suggested labels:** `documentation`, `help wanted`, candidate `good first issue` after scope confirmation.
- **Difficulty:** Small; requires bilingual technical review.

## 3. Document an isolated local Cloudflare Functions and D1 workflow

Live issue: [#7](https://github.com/keanu77/professional-sports-injury-atlas/issues/7).

- **Problem:** `npm run dev` does not run the backend, and the root Wrangler configuration names upstream databases. Contributors cannot safely reproduce API behavior from the current first-run instructions alone.
- **Expected outcome:** A documented local-only backend path with synthetic data and no production access.
- **Implementation scope:** Add a separate local configuration and runbook for `functions/` and `migrations/`. Inventory runtime variables and provide non-secret examples. Keep upstream bindings and production scripts unchanged.
- **Acceptance criteria:** A fresh environment can apply all migrations to local D1 and exercise representative reads and validation failures. Tests prove no upstream database/domain is used. Submission and rate-limit tests use synthetic data and a mail stub with no external delivery. Document remaining Turnstile/hosting limits.
- **Suggested labels:** `enhancement`, `documentation`, `help wanted`.
- **Difficulty:** Medium/large; backend and abuse-protection knowledge needed.

## 4. Validate and document the first-run workflow on WSL Ubuntu

Live issue: [#8](https://github.com/keanu77/professional-sports-injury-atlas/issues/8).

- **Problem:** Native Windows and WSL first-run behavior are explicitly unverified in `docs/development.md`. Shell environment prefixes, fonts, and provenance checks can behave differently across filesystem boundaries.
- **Expected outcome:** A dated, reproducible WSL compatibility report rather than an unsupported platform claim.
- **Implementation scope:** Use a fresh WSL Ubuntu environment with a full clone inside the Linux filesystem, pinned Node, documented fonts, and no maintainer credentials. Update only development/fork instructions and evidence needed to reproduce results.
- **Acceptance criteria:** Record OS/tool versions and exact outcomes for `npm ci`, type checks, unit suite, review build/artifact, demo checks/build, and local HTTP smoke. Preserve failures and their fixes. Make no native Windows claim unless separately tested.
- **Suggested labels:** `documentation`, `help wanted`.
- **Difficulty:** Medium; requires access to a Windows/WSL machine.

## 5. Design a code-only starter export with an explicit allowlist

Live issue: [#9](https://github.com/keanu77/professional-sports-injury-atlas/issues/9).

- **Problem:** A full fork retains restricted editorial material and historical evidence. The new demo produces clean static output, but there is no reusable source export that avoids bundling the full repository and still provides a meaningful application foundation.
- **Expected outcome:** An agreed export contract followed by a reproducible starter package using only licensed code and original synthetic content.
- **Implementation scope:** Begin with a design issue mapping code dependencies and mixed code/editorial files. Propose an explicit allowlist, original fixtures, attribution manifest, and an independent review/release configuration. Keep the maintained atlas and historical evidence intact.
- **Acceptance criteria:** Maintainer reviews the rights/dependency map before implementation. An export builds in a fresh directory without upstream records, media, signatures, secrets, or bindings; retains applicable licenses; cannot imply clinical approval. Tests reject accidental additions of restricted paths. Document feature gaps instead of disabling gates to claim parity.
- **Suggested labels:** `enhancement`, `help wanted`, `needs-triage`.
- **Difficulty:** Large; architecture and rights review required. Not a first issue.
