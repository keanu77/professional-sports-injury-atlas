# Sharing and release checklist

This checklist prepares human review. It does not authorize deployment, publish a post, or certify clinical content. Repository documentation can be merged without deploying the website; any later application release still follows the existing gates.

## Before sharing this branch's work

- [ ] Human reviewer approves the PR; the latest commit passes contributor CI. No automatic merge.
- [ ] Both default-branch READMEs and the Fork Guide are accessible and consistent.
- [ ] Recheck the live catalog before using the dated 200 / 7 / 193 / 30 / 14 counts. These are content counts, not audience or efficacy metrics.
- [ ] Confirm the original-code MIT scope, separate content/media rights, and no affiliation or clinical endorsement claims.
- [ ] Review [Facebook](facebook-zh.md), [LinkedIn](linkedin-en.md), and [developer introduction](github-introduction-en.md) copy for the destination's rules. Post manually; do not claim unmeasured outcomes.
- [ ] Review [About/topics](../github-discovery.md) and the status of the [five published contributor issues](../community/initial-issues.md). Recheck duplicates and label availability before opening further issues.

## Existing media and metadata

Use the prepared [1280×640 social preview](../media/social-preview-1280x640.png) for this repository after visual review. It combines existing site imagery and title text; the screenshot includes the site’s illustrated hero. No new third-party photographs were added. See [media provenance](../media/manifest.json) and [license scope](../../LICENSE-SCOPE.md). This is not a blanket asset license for forks. Do not add athlete photos without documented rights.

The existing [workflow recording](../media/catalog-demo.gif) is already in the README. It shows the site's interface and may include separately governed thumbnails or text. Do not extract or relicense those materials; recheck destination/platform rights before sharing recordings. The recording does not demonstrate video playback. The earlier [launch drafts](../launch/2026-10-20-圖鑑分享草稿.md) remain historical; use these audience-specific drafts for this change.

- [ ] If needed, manually upload the existing social preview in GitHub Settings → General. Inspect the actual GitHub share card; a local PNG is not proof it is configured.
- [ ] Recheck public title, description, canonical, Open Graph and Twitter/X Card on home and a detail page.
- [ ] Confirm share images load with the declared dimensions and suitable alternative text, and that public sitemap/robots behavior is correct.
- [ ] Keep review output noindex and privately hosted where required. Noindex is not access control.

## If publishing application changes later

- [ ] Obtain fresh release evidence for the actual input tree. This branch changes `package.json`; a previous public receipt does not approve it.
- [ ] Run the authorized release process, including rights, review, source, playback, artifact, and deployment-specific verification. Do not replace historical approval digests to pass a gate.
- [ ] Confirm deployment version, headers, assets, and runtime services after deployment. Do not treat a successful PR check as production verification.

## After a permitted post

Record only date, channel, public post URL, and the reporting window in a maintainer-owned log. Use the [measurement guide](../community/measurement.md). Report verified counts and concrete contributions; do not buy Stars, exchange follows, manufacture issues, or mass-message people.
