# Decision 16 Phase 1 — Trae Young rendition and registry v8

Date: 2026-08-14
Scope: `decision-16-trae-young-rendition-only`
Runtime used for generation and acceptance: Node `v24.14.0`

## Outcome

Phase 1 generated one governed local Trae Young rendition, promoted the
append-only player-photo registry to v8, and moved only the current Trae cover
projection to the new bytes. The two historical 39,619,306-byte files remain
tracked as source/history evidence and are not current resolver inputs.

The first and therefore highest-quality candidate in the declared ladder met
the 5,000,000-byte rendition ceiling. The accepted result is 2,390,278 bytes,
37,229,028 bytes (93.9669%) smaller than the frozen source original.

## Frozen source and local rendition facts

| Fact            | Upstream/source original                                           | Governed local rendition                                           |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Repository path | `src/assets/players/decision-15/trae-young.jpg`                    | `src/assets/players/decision-16/trae-young.jpg`                    |
| Role            | Immutable Decision 15 original                                     | Current cover rendition                                            |
| Dimensions      | 6351×5504                                                          | 2400×2080                                                          |
| Byte length     | 39,619,306                                                         | 2,390,278                                                          |
| SHA-256         | `b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0` | `0c7a77e45d05648b8e52e6db692086e240e883639e8a8617f36d44f70061fcaf` |
| SHA-1           | `193bb8a75e73f878359d136f0769205a4a8693ba` (MediaWiki fact)        | `55a301dad94c92e2db55f79ee41d04a7b21ef44d` (local diagnostic only) |
| JPEG framing    | Complete SOI/EOI                                                   | Complete SOI/EOI                                                   |
| Color / density | sRGB / 240 dpi                                                     | sRGB / 240 dpi                                                     |
| Chroma / scan   | 4:4:4 / non-progressive                                            | 4:4:4 / non-progressive                                            |
| Orientation     | No EXIF orientation tag                                            | Equivalent top-left value `1`                                      |

The unchanged upstream identity remains:

- Commons description URL:
  `https://commons.wikimedia.org/wiki/File:Trae_Young_(2022_All-Star_Weekend)_(cropped).jpg`
- fixed revision oldid: `1148485505`
- revision timestamp: `2026-01-16T19:13:29Z`
- original upload URL:
  `https://upload.wikimedia.org/wikipedia/commons/4/42/Trae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg`
- MediaWiki SHA-1: `193bb8a75e73f878359d136f0769205a4a8693ba`

The second historical copy, `src/assets/players/trae-young.jpg`, also remains
39,619,306 bytes with the same frozen source SHA-256. Neither historical path
was overwritten, moved, deleted, or re-downloaded.

## Deterministic transformation

The repository generator uses the lockfile's Sharp `0.35.3` (libvips `8.18.3`)
under Node `v24.14.0`. It reads only the committed Decision 15 original and
fails closed on source byte length, SHA-256, MediaWiki SHA-1, decoded geometry,
orientation, color space, creator metadata, output geometry, JPEG completeness,
and same-path drift.

Both source and rendition also complete a warning-strict Sharp raw-pixel decode.
The validator binds each decode result to the exact input byte length and
SHA-256, 3-channel dimensions, raw-pixel byte length, and raw-pixel digest. A
pre-SOS truncated JPEG with forged SOI/EOI and synchronized file facts is an
explicit negative fixture and is rejected.

- Resize: `fit: inside`, Lanczos3, longest edge exactly 2400 px,
  `withoutEnlargement: true`.
- Geometry: full frame, no crop, no enlargement, aspect ratio preserved.
- JPEG: quality ladder `[95, 92, 90, 88, 85, 82, 80]`, 4:4:4,
  non-progressive, `mozjpeg: false`.
- Selection: quality 95 produced 2,390,278 bytes and was selected immediately;
  lower-quality candidates were correctly not evaluated.
- Metadata: `keepMetadata()` retained the supplied creator/rights-bearing
  blocks. ICC, IPTC, and XMP remained byte-identical. EXIF changed only as part
  of re-encoding/orientation normalization and retained `Erik Drost`.

Metadata ledger:

| Block | Source                                                                           | Rendition                                                                        |
| ----- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ICC   | 3,144 bytes; `2b3aa1645779a9e634744faf9b01e9102b0c9b88fd6deced7934df86b949af7e`  | same bytes and digest                                                            |
| IPTC  | 13,184 bytes; `b89f09d74b9e0d8debd12bcb62be504b717f32239f32cb2c9d37e587fe6760b9` | same bytes and digest                                                            |
| XMP   | 12,011 bytes; `390cde215fe9be8639048f70665c13480de5e140cc084650f5fae810f3751ed9` | same bytes and digest                                                            |
| EXIF  | 14,010 bytes; `1a1c9581fce6d236b0d359f489fd9ba8649799c4fb6bade36b3d9801b81101e2` | 14,070 bytes; `7c4a8267208eeec90cca7f163df33bd25501085e01cb595a8b33555fdb566e57` |

## Visual and focal QA

The source and rendition were inspected side-by-side at full frame and with
the governed focal position `50% 35%`. Representative presentation crops were
rendered to temporary, untracked QA files and inspected at:

- 5:2 desktop: 1200×480
- 5:2 mobile 2×: 560×224
- 16:9 desktop: 1280×720
- 16:9 mobile 2×: 640×360

All four pairs retained the face, eyes, hair, clothing detail, pointing arm,
and intended focal composition. No visible rotation, color shift, face/detail
damage, or crop regression was observed. A decoded-channel comparison between
the source-derived and rendition-derived QA crops produced:

| Crop           | Mean absolute error |   RMSE | Maximum channel delta |
| -------------- | ------------------: | -----: | --------------------: |
| 5:2 desktop    |              1.6824 | 2.2698 |                    27 |
| 5:2 mobile 2×  |              1.4210 | 1.9335 |                    21 |
| 16:9 desktop   |              2.1939 | 3.0930 |                    52 |
| 16:9 mobile 2× |              1.3651 | 2.0887 |                    30 |

These measurements supplement, but do not replace, the completed human visual
inspection.

## Registry v8 and attribution boundary

- Registry v7 predecessor SHA-256:
  `77a146729b95802fbe978bc8a4360ed54929121936a04454afe49998ea93b0c4`
- Registry v8 SHA-256:
  `908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a`
- nba-v9 Markdown SHA-256:
  `03f6a61ee6ef958cae2ae9b918d7b6a115ff0d346f63202efce8780744fbadf2`
- nba-v9 JSON SHA-256:
  `0ac3fecc04e12b88134ce97d11fbe1c742af1f21664a9c80eaf0d76ab7cfcfba`

Registry v8 preserves all 20 non-Trae selection subtrees canonically and
changes only the Trae current-cover projection. The source-original facts and
the local-rendition facts are separately named and validated. The original
upstream disclosure remains exactly:

> Commons extraction and CropTool derivative; unmodified local original with
> site CSS presentation crop.

The separate local rendition disclosure is:

> The 6351×5504 Commons original was downscaled without cropping and
> JPEG-re-encoded to 2400×2080 for this local rendition.

The current no-JavaScript credit surface renders both disclosures as separate
rows. It also retains work title `Trae Young`, displayed credit and copyright
`Erik Drost`, CC BY 2.0 name/version/terms link, fixed revision link,
non-injury caption, and the non-clearance statement. The CC BY work has no
Adapter's License. The CC BY-SA composition firewall for the other works is
unchanged and remains passing.

## Protected-byte and resolver proof

- Other-cover count: 20.
- Other-20 asset ledger SHA-256:
  `9bbf6751bf16975d990757827839b1376aca8e2b3cc9fc63995f667d9cc0628f`
  (matches the authorized-start baseline).
- Other-20 selection aggregate SHA-256:
  `f222cf629755cc3e079f356ada2c1f46a8cd1fe34c516bcfac4da9ad66aed507`
  (matches the authorized-start baseline).
- Clinical freeze: 30/30 byte-identical; aggregate SHA-256
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
- Current resolver inventory: 21 exact static image imports. It includes
  `src/assets/players/decision-16/trae-young.jpg`; it does not import either
  `src/assets/players/trae-young.jpg` or
  `src/assets/players/decision-15/trae-young.jpg`.
- Historical v1–v7 registries and historical asset bytes remain verifier inputs
  only; registry v8 is the sole current renderer registry.

## Phase 1 checks

All commands below ran with the explicit Node 24.14.0 PATH.

- `decision16:rendition:check`: pass; exact 2400×2080, 2,390,278-byte q95
  regeneration.
- `player-photos:v8:check`: pass; exact registry digest.
- `source-policy:v9:check`: pass; exact policy digest.
- `player-photos:verify`: pass; 21 photos, 0 SVG fallbacks, 26 cases.
- `brand:verify`: pass; provenance and CC BY-SA firewall intact.
- Focused Phase 1 Vitest integration: 7 files, 138/138 tests passed.
- Full unit suite: 59 files, 1,111/1,111 tests passed.
- Targeted `e2e/player-photos.spec.ts`: 24/24 passed across Chromium,
  Firefox, WebKit, and mobile Chromium; the final central-credit refinement was
  rechecked 4/4 across the same projects.
- `tsc --noEmit`: pass.
- Astro diagnostics: 233 files, 0 errors, 0 warnings, 16 pre-existing hints.
- Content contract: 26 cases, 3 overviews, 1 update; pass.
- `decision13:clinical-freeze`: pass, 30/30.
- `git diff --check`: pass.

No build, manifest generation, service action, publishing, deployment,
indexing, external-account mutation, or remote-repository mutation occurred in
Phase 1.
