# Homepage hero image provenance

## Generation record

- Generation date: 2026-08-09
- Generator: OpenAI built-in `imagegen`
- Mode: text-to-image generation; no input or reference images
- Originality: this image was generated de novo for this project. It depicts fictional, non-identifiable anonymous athletes and does not copy or recreate any real player, team, league, venue, jersey, photograph, broadcast, or sporting event.

## Final asset

| Final path                         |  Dimensions | SHA-256                                                            |
| ---------------------------------- | ----------: | ------------------------------------------------------------------ |
| `src/assets/heroes/home-atlas.png` | 2400x900 px | `178f3989118f0f2f9cc5218c9c17aee4e72a1fccf16caf3e66279eba2d7f71bb` |

## Portrait, trademark, and event redlines

- The final prompt literally requires: `anonymous athlete, face not visible`.
- No identifiable real player or other identifiable person.
- No NBA, team, league, sponsor, venue, apparel, shoe, or other trademark or logo.
- Plain, unbranded kit only; no recognizable jersey design, number, badge, or emblem.
- Original generic injury imagery only; no recreation of a real game, injury, photograph, broadcast, or sporting event.
- No text, signage, labels, or watermark.

## Processing record

The selected 2048x768 px built-in output already matched the required 8:3 aspect ratio and was resampled with Apple ImageIO `sips` to the exact 2400x900 px delivery dimensions. Only the final delivery asset is retained in the repository.

## Exact final prompt

```text
Use case: photorealistic-natural
Asset type: homepage hero image for a physician-facing professional sports injury atlas, wide 8:3 panoramic composition
Primary request: original editorial sports medicine photograph representing three generic injury themes—ACL knee, ankle sprain, and Achilles tendon—through a cohesive layered scene of anonymous athletes' lower bodies and clinical details on an indoor court
Scene/backdrop: atmospheric unbranded indoor hardwood court with subtle court geometry, deep low-saturation blue shadows and natural haze; no crowd details and no real venue
Subject: three complementary lower-body vignettes grouped within the right 55%—a taped flexed knee, a braced ankle during a generic cutting stance, and a calf/Achilles heel-rise detail; anonymous athlete, face not visible
Style/medium: photorealistic high-end editorial sports photography, Aspetar Journal-like visual authority, realistic skin and fabric texture, shallow depth of field, tasteful fine grain, not an illustration and not CGI
Composition/framing: extremely wide cinematic 8:3 frame; keep the left 45% calm, dark, and visually uncluttered as negative space for real HTML typography; subjects entirely within the right 55%; allow responsive center crop
Lighting/mood: dramatic directional court light, brand-blue dominant grade, restrained warm orange and golden amber rim-light accents, clinically credible and sober
Color palette: deep desaturated navy and brand blue as main tone, one restrained warm orange accent and one restrained golden amber accent
Constraints: anonymous athlete, face not visible; original generic injury imagery only; plain solid-color unbranded athletic kit and shoes; no identifiable real player; no NBA, league, team, sponsor, venue, or apparel trademarks; no recognizable jersey design; do not recreate or resemble any specific real injury event or broadcast frame; no visible injury gore; no text; no numbers; no logos; no watermark
Avoid: vector art, illustration, 3D render, composite seams, anatomy overlay labels, celebrity likeness, visible faces, spectators, broadcast graphics, branded footwear, distorted limbs, extra fingers or feet
```
