# G6 Decision 11 — P0 Rights Remediation Evidence

- Audit date: 2026-08-12 (Asia/Taipei)
- Live video check: 2026-08-11T17:29:36Z
- Authority: Decision 11 in `/Users/ethanai/co-work/online_sportsinjury/.claude/g2-owner-decisions.md`
- Reviewed BLOCKED report: `/Users/ethanai/co-work/online_sportsinjury/.claude/g6-rights-review.md`
- Authorized plan: `docs/superpowers/plans/2026-08-12-g6-rights-remediation.md`
- Plan decision: `docs/decisions/2026-08-12-g6-rights-remediation-authorization.v1.json`
- Scope: P0-1 Taiwan playback and P0-2 ShareAlike composite risk only

This evidence does not clear public release. Deployment, indexing, remote mutation,
hosting/account work, and any change to approved clinical wording remain closed.

## P0-1 — Anthony Edwards 2023 Taiwan playback

### Live result and candidate selection

The existing ESPN upload is currently unavailable to the site's Taiwan audience.
The check used YouTube's current WEB player response with `gl=TW`, then inspected
`playabilityStatus` and
`microformat.playerMicroformatRenderer.availableCountries`.

| Candidate                                                                                                                        | Provenance and event match                                                        | Taiwan result                                                                                                                        | Decision                                                                |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [`V9mtX4mE8wQ`](https://www.youtube.com/watch?v=V9mtX4mE8wQ)                                                                     | ESPN `@espn`; the governed 2023-03-17 Anthony Edwards right-ankle event           | `availableCountries` has 60 entries and excludes `TW`; `playabilityStatus=UNPLAYABLE`; `playableInEmbed` is absent                   | Keep the original URL only as a labelled external link                  |
| [`Hto4VdTZceM`](https://www.youtube.com/watch?v=Hto4VdTZceM)                                                                     | NBA `@NBA`; official full-game highlights for Timberwolves at Bulls on 2023-03-17 | 24 countries and no `TW`; `UNPLAYABLE`; `playableInEmbed` absent                                                                     | Reject: not Taiwan-playable and not a qualified exact-event replacement |
| [`JTFpzWrZvg4`](https://www.youtube.com/watch?v=JTFpzWrZvg4)                                                                     | FanDuel Sports Network North; metadata is the 2021-02-25 Bulls game               | Not the governed event                                                                                                               | Reject                                                                  |
| [`zNU_TTKpMi4`](https://www.youtube.com/watch?v=zNU_TTKpMi4)                                                                     | NBA `@NBA`; double-overtime ending                                                | Not the first-quarter ankle event                                                                                                    | Reject                                                                  |
| [`Anthony Edwards leaves the game due to injury`](https://www.nba.com/watch/video/anthony-edwards-leaves-the-game-due-to-injury) | NBA.com; date, opponent, quarter, and injury match; internal `videoid=1064743`    | No canonical YouTube ID or independently verifiable Taiwan embed; NBA deep-link remediation is separately required by Decision 11 P2 | Reject as an embed replacement                                          |

Search also found third-party reposts, including NBA Buzz and Adriel Sports.
They were excluded without adoption. No video was downloaded, re-hosted, mirrored,
proxied, or used to bypass the rightsholder's regional restriction.

Reproduction outline (the public page supplies the current WEB client metadata and
public Innertube key; the key is deliberately not retained in this report):

```sh
curl -sSL 'https://www.youtube.com/watch?v=VIDEO_ID&hl=en&gl=TW'
curl -sS 'https://www.youtube.com/youtubei/v1/player?key=KEY&prettyPrint=false' \
  -H 'content-type: application/json' \
  -H 'origin: https://www.youtube.com' \
  -H 'user-agent: Mozilla/5.0' \
  --data-raw '{"context":{"client":{"hl":"en","gl":"TW","clientName":"WEB","clientVersion":"CURRENT_PAGE_VALUE"}},"videoId":"VIDEO_ID","contentCheckOk":true,"racyCheckOk":true}'
```

### Implemented fallback and invariants

- `V9mtX4mE8wQ` is recorded as a governed Taiwan restriction with the exact
  check time and result.
- Anthony's current case playback state moves monotonically from the frozen
  origin snapshot `verified` to `external-link-only`; only a strictly later
  `verified` → `external-link-only` recheck is permitted by cross-validation.
- Review and public rendering show a Taiwan restriction notice and one ESPN
  original-page link. They render no local photo facade, load button, player
  stage, or iframe and make no pre-click YouTube-family request.
- The immutable source manifest is not rewritten because provider, URL,
  uploader, event binding, duration/window, sources, and video identity did not
  change. The current state is a later availability observation, not an origin
  correction.
- The approved clinical payload remains byte-semantically identical:
  `26e62a6d7a474167ebed2185771e53cd854eb5a54a8c7e20e8b87adff03fce0a`.
  It still equals `review.reviewedContentDigest`.
- The video identity digest remains
  `0d4d492fac7ac1dac84b8497ea28a1381188ec5256961884f13b2610cc1a8303`.
  The availability-sensitive video-source digest changes to
  `ac4ab7c700ff401aaef207375635f715c8d44323b61f6c3fac63e290a18e88aa`.
  No Q3 identity pointer or approved clinical digest changes, and no medical
  review decision is fabricated.

The four-browser Playwright test passed for the dedicated fallback: one labelled
external link, zero facade/load/stage/iframe nodes, and zero third-party requests.

## P0-2 — OG and composite-image audit

### Source and generator inventory

The tracked site image inventory contains exactly 37 files:

- 16 `src/assets/heroes/*.png` assets generated from text prompts;
- 21 `src/assets/players/*.jpg` Wikimedia Commons photos;
- zero other tracked raster or SVG assets, including zero named OG, social,
  share-card, infographic, screenshot, or composite outputs.

Player-photo license distribution at audit time is CC BY 2.0 × 9,
CC BY-SA 2.0 × 5, and CC BY-SA 4.0 × 7.

The hero provenance registry says all 16 hero PNGs were generated with OpenAI
ImageGen from text without an input/reference/broadcast photo. Its recorded
post-processing is crop/resample only. No retained hero compositor exists.

Every player JPEG enters production through
`src/lib/ui/editorial-images.ts` and is rendered through Astro `<Picture>` in
`src/components/cases/CaseCover.astro`. Astro produces a one-input responsive
resize/encode rendition. The visible 5:2 or 16:9 crop is CSS
`object-fit: cover`; captions, labels, play controls, links, and card layout
remain separate HTML/CSS nodes and are not baked into the pixels.

`src/layouts/BaseLayout.astro` has no `og:image`, `twitter:image`, or social-card
image metadata. `package.json` has no direct Sharp, Canvas, Jimp, Satori,
Resvg, or other raster-composition dependency and no OG/social/composite
generator command. Repository executable-source searches found no player-photo
flow into `.composite()`, `createCanvas`, `drawImage`, `fillText`, Satori,
Resvg, ImageMagick, FFmpeg, or an image endpoint.

Audited file hashes:

| File                                               | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `src/assets/heroes/provenance.json`                | `45ea1a2efee5293e87e49fa61daab65124325d054012b760239a7385473a7f0b` |
| `src/assets/players/player-photo-registry.v1.json` | `770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec` |
| `src/lib/ui/editorial-images.ts`                   | `12dcc0fa365733f4f5b8a5e4b7c178eb6ced5bab71628b8f2874c6ee1158d13a` |
| `src/components/cases/CaseCover.astro`             | `621124c372226dac030c961d17876051c124b33255050c4bc6816a3fad0a8bed` |
| `src/layouts/BaseLayout.astro`                     | `83b608f44627f7a8a4537776ee5beac9262e6011d8b2471afeac98a062c27921` |
| `package.json`                                     | `bd46f328c3b5261537725c585393a92cb3a6efcd1b1b2174491857a387318ef4` |

### Built-output inspection

The review build completed 41 pages and 831 optimized-image transforms. The
resulting `dist/_astro/` contained 863 image files: 279 AVIF, 237 JPEG,
65 PNG, and 282 WebP. Every basename stem mapped to one of the 37 governed
sources; unknown stems were zero.

There were 669 player-photo outputs. Each of the 21 photos had exactly one
byte-identical source emit; all 669 outputs retained the source aspect ratio,
so none added a site-owned layout canvas. A deterministic Sharp lineage check
of all 31 Anthony Edwards outputs found one original byte match and 30 exact
single-input resize/encode matches at the configured qualities, with zero
unmatched files.

Conclusion: no CC BY-SA player photo is combined with site-owned text, layout,
icons, or artwork into an OG image, case-card raster, infographic, social card,
or any other single image file. Ordinary Astro renditions and CSS crops are not
baked site-design composites.

### Fail-closed guard

`brand:verify` now rejects:

- any unreviewed production consumer of the governed player-photo pipeline;
- any player-photo reference combined with raster/canvas/SVG composition calls;
- player-photo use in OG/Twitter image metadata;
- new OG/social/share/infographic/composite-named raster assets or generator
  commands; and
- direct raster-composition packages until a fresh rights audit.

Mutation tests cover an allowed Astro `<Picture>` consumer, a new image
endpoint consumer, Canvas composition, social metadata, new composite rasters,
generator scripts, and direct composition dependencies.

## P0 validation record

All commands used Node 24.14.0 with the authorized plan asserted. Passing gates:

```text
plan:assert-authorized
astro check: 0 errors, 0 warnings (existing hints only)
focused Vitest: 97 tests
content:check
player-photos:verify
brand:verify
build:review: 41 pages, 831 image transforms
Playwright video-player.spec.ts: 52 tests across Chromium, Firefox, WebKit, mobile Chromium
verify:review-artifact: 41 pages, 26 case pages; noindex; no iframe/preconnect/nonlocal images
```

`verify:review-artifact` continues to report hosting header delivery as
`not-verified`, because Decision 11 forbids any hosting request. That is not
treated as public clearance.
