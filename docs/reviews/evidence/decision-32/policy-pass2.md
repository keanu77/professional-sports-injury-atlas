# Decision 32 policy copy Pass 2

Independent read-only review of six rewritten public components/pages and supporting implementation. No browser, legal-compliance certification, or deployment verification was performed by this reviewer.

## Finding resolved after re-read

- **Resolved P2 — medical reviewer scope was broader than recorded approvals (confidence 0.85).** `src/pages/about.astro:19` says all general educational content is reviewed by Dr. Wu. The recorded `src/data/public-launch.v1.json:9` scope is native embeds and approved patient guides; the three `src/data/patient-guides/*.json` explicitly bind reviewer and content digest. The later general/head first-aid blocks at `src/pages/videos/[slug].astro:91`–147 are sourced to CDC/NHS and do not themselves carry those guide approvals. This does not establish that the physician never read those blocks, but the public sentence exceeds the scope this review can substantiate. Narrow the claim to the three approved injury guides, or omit the global reviewer sentence. Retain the separate statement that player diagnoses/returns are reported from public sources.

## Verified against implementation

- **Click activation and local covers: accepted, confidence 0.99.** `src/pages/privacy.astro:16`–17 and `src/pages/credits-notices.astro:49`–51 match local asset imports in `src/components/cases/VideoThumbnail.astro:9`–19. `src/scripts/video-player.ts:75`–114 creates the iframe and loads the YouTube API only within the click handler. `src/lib/video/youtube.ts:98`–100 constructs youtube-nocookie embeds. The copy explicitly allows reading without playback and correctly distinguishes leaving through the original source link.
- **Privacy-enhanced mode is not zero data transmission: accepted, confidence 0.98.** `src/pages/privacy.astro:20`–26 agrees with the implementation and official YouTube/Google disclosures. No claim that nocookie eliminates all information transfer remains.
- **Local preference storage: accepted, confidence 0.99.** `src/pages/privacy.astro:36` matches `src/scripts/preferences.ts:18`–30, 59–62 and font controls. These preference functions have no network transmission. Clearing site storage removes the keys.
- **Hosting disclosure: accepted, confidence 0.98.** `src/pages/privacy.astro:42`–50 separates Cloudflare connection processing from site-added tracking and external contact-form processing. Official Cloudflare End Users section includes IP/traffic/system configuration data. This is a description of processing, not a promise of a specific retention period or an unsupported no-logs guarantee.
- **Source facts and return semantics: accepted, confidence 0.98.** `src/pages/source-policy.astro:26`–48 accurately describes source attribution, original-source review, competition-level separation, null earliest dates, and calendar differences. `src/components/cases/EventFollowUp.astro:24`–45 omits numerical intervals when null, displays context, and exposes actual source/check dates. Final batch Eaton is a concrete null example. This copy does not convert AI consensus to evidence or claim diagnosis from video.
- **No affiliation / rights overclaim: accepted, confidence 0.98.** `src/components/layout/SiteFooter.astro:33`–34, `src/pages/about.astro:28`–29 and `src/pages/credits-notices.astro:20`–25 describe independent education and native platform playback without claiming ownership, universal authorization, guaranteed availability, or authority to permit reuse. Multi-sport wording replaces obsolete NBA-only framing.
- **Canonical medical sentence preserved: accepted, confidence 1.00.** `src/components/notices/MedicalNotice.astro:24` still directly renders the same imported constant; only separate link text changed at line 27. `src/pages/credits-notices.astro:35`–36 keeps the identical constant under the same medical-notice anchor. `git diff` confirms no edit to `src/lib/medical-notice.ts`.
- **Historical photo records preserved: accepted, confidence 1.00.** `src/pages/credits-notices.astro:66`–78 retains the details section and full `currentPhotoCredits.map`/`PhotoCredit` rendering. `src/lib/rights/photo-credits.ts` and `src/components/credits/PhotoCredit.astro` have no diff. The copy explicitly excludes extending those photo licenses to video/YouTube thumbnails.

## Official source reading

- [YouTube embedding / privacy-enhanced mode](https://support.google.com/youtube/answer/171780?hl=en): independently opened; nocookie mode, personalized-use limits, outbound policy, age restrictions, uploader embedding control.
- [Google Privacy Policy](https://policies.google.com/privacy?hl=en): independently opened; includes IP, device/browser, request and usage information.
- [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/): independently opened and inspected End Users section, which separately covers customer-site connections.

## Limits and rejected findings

- The exact current Cloudflare dashboard configuration and live pre-click network traffic were not tested here. Static code supports “site itself has not added visitor analytics”; root release/browser verification must check the served version.
- Contact and parent-site privacy URLs were not independently live-checked in this review; root agent is performing that bounded verification.
- Rejected: “Privacy-enhanced mode must mean no third-party data” (confidence 0): contradicted by Google/YouTube disclosures; current text correctly avoids it.
- Rejected: “Historical photo credits should be removed because covers changed” (confidence 0): preserving historical per-asset attribution is intentional and the new copy distinguishes current covers clearly.

## Final follow-up

Re-read `src/pages/about.astro:19` after root correction: the global physician-review assertion is removed. It now attributes educational points, athlete injuries and game records to public sources, and does not present these as site-issued diagnoses. P2 resolved; no remaining blocking copy findings.

Read updated `scripts/public-launch/verify-browser.mjs` diff and its surrounding JS-disabled context: four policy pages join each viewport’s normal checks; exact headings/footer titles are asserted; historical credits can be expanded; all four footer links are followed with JavaScript disabled. Assertions are correctly placed outside the video-only branch. These are static review findings; execution remains root responsibility.

Root reports contact and main-site privacy URLs returned HTTP 200. This reviewer did not independently repeat those live requests. Preview network verification remains root-owned.

Reviewed file hashes:

- `src/components/layout/SiteFooter.astro`: `0b35ace2c9c4ae3b985319749ad61203aff529c1fa2ba2e60c9690fbd1c8cdca`
- `src/components/notices/MedicalNotice.astro`: `f9d8c9e4abaa2adc86874ae757c3d14112d9a65701027c07633359c32a66cc44`
- `src/pages/source-policy.astro`: `dbc33a215f3464d33d2561705f33f0d60eb45988083a28c881938d821a0968e2`
- `src/pages/privacy.astro`: `6b75b5dd2d8441d48a1c6d061c40b39edb8d18e92f837d72b57da5b3affcb306`
- `src/pages/about.astro`: `22e3145d38feb2d22af0d3ac6731c4dab52ed4b7eaa1bfc0e1bc0abb1f0be1be`
- `src/pages/credits-notices.astro`: `a39dc622ec2082fef2989f90c21550bde2512bb8adea2494b761ea5b63e2bdc8`
- `scripts/public-launch/verify-browser.mjs`: `61cc4f6e19fc4849b16d2e3b1e1b5d2bf328f9a8e8237b704e65fb7efcdf6bea`
