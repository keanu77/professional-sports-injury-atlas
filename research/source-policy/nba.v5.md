# NBA source policy (`nba-v5`)

This immutable addendum is the Decision 13 named-cover policy. Its machine-readable companion is `source-policy.v5.json`. It inherits the complete clinical, diagnosis, event-video, provider, media-handling, indexing, and compatible attribution rules from immutable `nba-v4`. It changes only the governed player-cover occasion, provenance-risk, fallback, and composition controls described below.

The parent `nba-v4` JSON SHA-256 is `3320fe2051fc091aa055d5cdd8bcdacf24073c3964cac3d1a982666a2aafbf68`; the parent Markdown SHA-256 is `929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994`. Existing clinical cases, injury overviews, quarterly updates, source manifests, source-review decisions, and medical approvals remain bound to their existing immutable bytes. This version does not authorize medical-content changes, publication, deployment, indexing, hosting mutation, external-account mutation, or remote-repository mutation.

## Decision 13 eligible occasions

Occasion classification is a context triage and never a copyright, personality-rights, medical, or public-release clearance. A current photo must have evidence establishing exactly one accepted non-event context: `verified-media-day`, `press-conference`, `public-event-or-fan-interaction`, `award-ceremony`, or `documented-preseason-tune-up-warm-up-outside-live-competition`.

`verified-media-day` permits only an independently licensed non-event photograph with a verified license and author chain. An official team or league headshot, official photo-shoot portrait, commercial agency or newswire image, ambiguous identity, or uncertain authority remains rejected.

Regular-season pregame or warm-up, live preseason competition, regular-season/play-in/playoff action, international competition, All-Star game action, and any ambiguous credentialed-court context remain `game-action-high-risk` and ineligible as a current cover. A warm-up is eligible only when source evidence affirmatively establishes a preseason or tune-up setting outside live competition. Silence or a generic arena caption is not evidence.

## Photographer and provenance risk

Photographer/provenance risk is recorded independently from occasion. Every accepted photo must bind the photographer identity, Commons uploader identity, their evidenced relationship or explicitly unresolved relationship, the fixed Commons revision, and any original upstream page separately. A Commons or Flickr uploader name alone does not establish that the uploader is the photographer or has authority to license the work.

The controlled categories are:

- `independent-public-event-low-risk`: a verified individual photographer documenting an accepted public non-event, with an evidenced license chain;
- `credentialed-media-residual-risk`: a credentialed media photojournalist whose original license chain is verified, while the residual contextual risk remains explicit; and
- `unresolved-reject`: washed, contradictory, incomplete, agency-origin, or otherwise unresolved provenance. This category is never eligible for a current photo.

Low risk is not public-use clearance. No record may claim that Commons availability, a Creative Commons label, a non-event setting, or either eligible risk category proves copyright authority, personality-rights clearance, or publication approval.

## Exact license and attribution obligations

Only exact, supported CC BY 2.0/3.0/4.0, CC BY-SA 2.0/3.0/4.0, and CC0 1.0 pairs are eligible. Public Domain Mark is not CC0. Unknown, NC, ND, fair-use, screenshot, footage-derived, agency, newswire, official-headshot, or ambiguous material is rejected.

Every accepted photo retains the exact supplied work title or the explicit `not-supplied` state, photographer and uploader identities, exact license name/version/link, Commons revision permalink, alteration disclosure, and the separate copyright, disclaimer, and per-file notice-retention states defined by `nba-v4`. BY, BY-SA, and CC0 use separate templates. BY and CC0 never receive ShareAlike language. Every presentation crop of a BY-SA work declares a linked, version-compatible Adapter's License limited to the crop contribution; it does not license the surrounding page, text, layout, icons, or other site-owned material.

## Local assets, fallbacks, and composition

Runtime remote image fetches are forbidden. An accepted Commons photo is downloaded once from the frozen original URL and is rendered from verified local bytes. Its record retains local path, MIME type, dimensions, byte length, SHA-256, crop checks, exact athlete/case mapping, current-cover state, and supersession reason.

When no photo satisfies identity, occasion, photographer/provenance, license, and technical requirements, the current cover is an `original-svg-fallback`. The fallback record carries site-owned provenance and verified local bytes without inventing a Creative Commons license. Its SVG must contain no external fetch, linked or embedded raster, copied player likeness, team/league logo, third-party font, script, or foreign object.

CC BY-SA photos may be used as ordinary local HTML/CSS images and ordinary responsive renditions, subject to their complete attribution. They must never be inputs to site-composed OG, social, case-card, infographic, or other baked design images. A composed image may use only site-owned artwork or a separately verified BY/CC0 input whose obligations are met.

## Immutable registry cycle

Historical `player-photo-registry.v1.json`, `player-photo-registry.v2.json`, and `player-photo-registry.v3.json` remain byte-immutable. Registry v4 binds all three exact predecessor paths, schema versions, and SHA-256 digests. It expresses each current athlete/case selection as either a qualifying local Commons photo or an original site-owned SVG fallback, while preserving the superseded-cover reason. It does not rewrite the predecessor projection.

Validators reject predecessor drift, same-version drift, high-risk current covers, missing occasion or photographer evidence, unsupported licenses, bucket/license mismatches, missing title or notice state, invalid Adapter's Licenses, remote image fetches, or third-party raster content in an SVG fallback. A later policy or registry change requires a new immutable version and the complete applicable verification, review-set, review-build, private-manifest, and owner-decision cycle.
