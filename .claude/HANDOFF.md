# HANDOFF — 2026-09-06 Decision 21

User approved the public patient-facing preview: 「預覽內容可以，請繼續」. This follows the explicit question reviewing the new patient copy and local 14322 preview. Three guides now record current digest-bound approval by 吳易澄 dated 2026-09-06. Do not ask again for the same approval.

User wants a public embedded-video-first site, short immediate-care and return-to-sport explanations; injury, sport and competition level unrestricted. Canonical repo is this folder, not mini-backup. Old 4321 reference remains untouched.

Implemented: video-first filtering; single facade per case; concise approved patient guides; separate D20-signed official participation summary; collapsible professional notes/sources. Frozen original cases, sidecars and D20 ledger unchanged.

Public release uses explicit Decision 21 successor protocol, five digest-bound native YouTube embeds with verified captions. D17/v2 historical prohibitions and v1 review restrictions remain enforced on legacy paths. See docs/reviews/2026-09-06-decision-21-launch-status.md for exact scope and checks.

`npm run release:public` verifies clean tree, current input hashes, patient approvals, original content/provenance/clinical/follow-up checks, fresh real playback, then builds public and checks exact output. `npm run deploy:public` subsequently uploads dist to sports-injury-atlas. Never upload review dist.

Latest public build passed. New homepage Lighthouse: LCP 1803ms, a11y 1.00. Prior UI test baseline: 256 four-browser tests; real Chrome streaming is separate, all five play and captions activate. Final regression: 1300 unit tests and 256 four-browser tests passed; final font adjustment passed 50 related tests. Production verification is complete below.

Node: /Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin. Clean test clone: /tmp/atlas-d21-checkout, full shared history; node_modules local symlink. D18 completed receipt requires clean worktree. Preview 14322 serves clone dist; use ATLAS_E2E_PORT=14321 for existing review tests.

Cloudflare production is live at https://sports-injury-atlas.pages.dev/. No Git remote or push; no mini transfer needed. Original D20 handoff remains in commit 3fd1146.

## Completed production release

- User-requested website launch is complete. Production commit `bce372132459ad2af5c658c26a36bbbb04b05f79`; feature commit `40eb138`.
- Pages deployment `0ed8d605-cc9a-4a51-9c21-2c05e054be91`, Production/main, https://0ed8d605.sports-injury-atlas.pages.dev.
- 15 HTML pages / 5 approved embedded-video cases. Exact served SHA-256 matches for 19 HTML/JSON/robots responses; no review routes; unknown paths return 404.
- Live Chrome: all five videos played, captions toggled on. Production mobile/desktop Axe and no-JS checks passed. Evidence saved under docs/reviews/evidence/decision-21/.
- Final Lighthouse: home 1804ms, Achilles overview 1503ms, both a11y 1.00; duplicate full Chinese heading font download removed, glyph fallback uses system CJK fonts.
- Verified at 2026-09-06T01:07:44.415Z (09:07 Taiwan). `ops/public-hosting.v1.json` records exact deployment.
- Root public dist is the deployed artifact; root preview also available on 14323. The prior 14322 clone preview and original 4321 remain separate.
- Follow-up docs commit does not alter the deployed source inputs. Do not redeploy solely to change its commit ID.
