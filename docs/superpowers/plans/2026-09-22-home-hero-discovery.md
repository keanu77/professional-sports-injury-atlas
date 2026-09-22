# Homepage hero and compact discovery implementation plan

> Use subagent-driven-development for the isolated hero task and sequential specification/quality review. Root owns shared discovery, integration, validation and release. Preserve the current workspace and branch per the user's existing preference.

## Scope and authority

- Execution role: `home-hero-discovery`; execution scope ID: `home-hero-discovery-release`; required closed scope IDs: `external-account-mutation`, `hosting-configuration-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`.

Exact user authorization: 「A2 首頁配置＋手機適配＋搜尋區精簡」, accepting the prior concrete proposal. Implementation, browser verification and updating the existing site are authorized; no repeat approval is required. The immutable specification is `docs/superpowers/specs/2026-09-22-home-hero-discovery-design.md`.

## Task 1: A2 hero (isolated implementer)

- Copy only the selected existing A2 artwork into `src/assets/hero/`; use installed Astro image tooling to deliver responsive AVIF/WebP without a new dependency.
- Edit `src/pages/index.astro` hero markup/styles only. Preserve first-position social links and existing category slot; add responsive decoration, count-label clarification and two meaningful actions. Keep text readable in both themes, all text-size settings and 320px width, without cropping important desktop subjects or pushing mobile search below the current baseline.
- Format changed source; report exact source-file provenance and generated-image configuration. Root runs the combined browser checks.

## Task 2: Compact discovery (root)

- Edit `VideoDiscovery.astro` and `video-discovery.ts`: desktop controls share a row, mobile sport/body filters use an accessible disclosure, one copy of each input, selected-filter buttons outside the collapsed region with explicit labels and safe focus.
- Preserve the original controller's IME, URL/history, mode races, full-catalog filtering, fixed type groups and 24-item pagination behavior. Keep no-JavaScript static cards and category links.
- Add meaningful E2E coverage for responsive hero, collapsed and active filters, removal/history, source image load/bytes, light/dark and keyboard/font-size behavior. Adapt existing tests to open intentionally collapsed filters without weakening their assertions.

## Task 3: Review and validation

- Obtain independent spec compliance review, resolve gaps, then code-quality review; root inspects the final diff.
- Run scoped format/diff checks, Astro check, content check, plan binding and unit tests. Run desktop Chrome/Pixel 7 E2E against the exact public build, plus visible 320/390/1440px checks. Check responsive image sizes and no preconsent embeds.

## Task 4: Release and closeout

- Preserve earlier handoff/artifacts. Ignore local `output/` previews and retain only the selected image in production assets. Bind this new specification/plan/decision using the existing binder; do not rebind frozen clinical foundation documents.
- Update only the rendering input digest in the existing launch approval, commit the complete implementation, run original `release:public`, verify the exact tested artifact, push and deploy to the existing Pages project.
- Compare production HTML/assets and exercise homepage filters and sharing on production. Record evidence under `docs/reviews/2026-09-22-home-hero/`, update handoff and clean up owned temporary previews. Completion records remain separate from this bound plan.
