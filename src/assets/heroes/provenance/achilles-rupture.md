# Achilles-rupture image provenance

## Generation record

- Generation date: 2026-08-09
- Generator: OpenAI built-in `imagegen`
- Mode: text-to-image generation; no input or reference images
- Originality: all five images were generated de novo for this project from the prompts recorded below. They do not depict or intentionally imitate an identifiable real athlete, team, league, venue, or real sporting event, and they were not derived from stock photography or team/league media.

## Final assets

| Final path                                        |  Dimensions |       File size | SHA-256                                                            |
| ------------------------------------------------- | ----------: | --------------: | ------------------------------------------------------------------ |
| `src/assets/heroes/achilles-rupture-overview.png` | 2400x720 px | 1,632,617 bytes | `6d7858ec369c61e74891718672b6e66ed728a557124e236d60c306e82637387b` |
| `src/assets/heroes/achilles-rupture-case-01.png`  | 2400x960 px | 2,434,683 bytes | `0a9702b965b72ddc1c9130ce34dc1b48fab268a9dd628422958380b2d2629bec` |
| `src/assets/heroes/achilles-rupture-case-02.png`  | 2400x960 px | 2,498,406 bytes | `037bb950968e93b7ff1277f597b4eda0ed94589bb88f9bba888fdd13368777df` |
| `src/assets/heroes/achilles-rupture-case-03.png`  | 2400x960 px | 2,160,891 bytes | `2f5fb577d579ed13ef607a4aec4342e9924df83b55cc427f833ecea1bcc7f46f` |
| `src/assets/heroes/achilles-rupture-case-04.png`  | 2400x960 px | 2,763,207 bytes | `6334f689d1b26b2a6e959708d6f1560594a9cf1249f9da2f3baa82f93db67b0d` |

## Editorial and trademark redlines

- Every final prompt explicitly requires: `anonymous athlete, face not visible`.
- No identifiable real player or celebrity likeness.
- No NBA, team, league, sponsor, manufacturer, clinic, venue, apparel, shoe, medical-device, equipment, or other trademark/logo.
- Plain, unbranded kit, footwear, tape, equipment, and clinical environment; no recognizable jersey or footwear design.
- Original fictional scenes only; no recreation of a real event.
- No text, letters, numbers, labels, signage, or watermark.
- Final visual inspection confirmed that faces remain outside the frame and no visible marks conflict with these redlines.

## Processing and crop record

- Only the final delivery assets are retained in the repository.
- Overview source: 1983x793 px. It received a centered crop to 1980x594 px for the exact 10:3 delivery aspect ratio, preserving the athlete in the rightmost approximately 40% and calm negative space on the left, then was resampled to 2400x720 px.
- Case 01 source: 1983x793 px. It received a centered crop to 1980x792 px for the exact 5:2 delivery aspect ratio, then was resampled to 2400x960 px.
- Case 02 source: 1942x809 px. It received a centered crop to 1940x776 px for the exact 5:2 delivery aspect ratio, then was resampled to 2400x960 px.
- Case 03 source: 1774x887 px. It received a centered crop to 1770x708 px for the exact 5:2 delivery aspect ratio, then was resampled to 2400x960 px.
- Case 04 source: 1983x793 px. It received a centered crop to 1980x792 px for the exact 5:2 delivery aspect ratio, then was resampled to 2400x960 px.
- Crop and resampling were performed as separate passes with Apple ImageIO `sips`. Finals are 8-bit RGB PNGs. Only the final delivery files are retained in the repository.

## Exact final prompts

### `achilles-rupture-overview.png`

```text
Use case: photorealistic-natural
Asset type: ultra-wide website hero for a professional sports-injury atlas
Primary request: Create an original photorealistic editorial sports medicine photograph focused unmistakably on the Achilles tendon, calf, and heel during explosive court movement. Show an anonymous athlete, face not visible, captured from a low rear three-quarter viewpoint as the athlete pushes off, with the lower leg and heel sharply defined and the Achilles region anatomically plausible.
Scene/backdrop: a dark, modern indoor training court with subtle atmospheric depth; no identifiable arena and no spectators
Subject: one adult anonymous athlete, face not visible; athletic but natural body proportions; plain unbranded navy training kit and completely generic unbranded footwear; no visible face
Style/medium: premium dramatic editorial sports photography, genuinely photographic, realistic skin pores and tendon contours, realistic fabric and shoe textures, subtle fine film grain, no illustration and no CGI look
Composition/framing: extremely wide panoramic landscape, approximately 10:3 aspect ratio. Reserve a calm, uncluttered negative-space field across the LEFT 60% for interface copy. Place the athlete and all meaningful action in the RIGHT 40%, with the calf, Achilles tendon, heel, and shoe as the focal plane. Keep the head out of frame or fully turned away.
Lighting/mood: controlled sidelight and rim light, deep low-saturation shadows, confident clinical-athletic mood
Color palette: brand-blue anchor in the court ambience and shadows, restrained cool neutrals, a subtle warm gold/amber edge-light accent at the heel; sophisticated, not neon
Constraints: anonymous athlete, face not visible; original fictional scene; Achilles/calf/heel anatomy must read distinctly rather than knee/ACL or lateral ankle; one athlete only; plain unbranded kit; generic unbranded shoe; no real player; no identifiable person; no real-event recreation; no NBA, team, league, sponsor, apparel, or shoe logos; no recognizable jersey or uniform design; no text; no numbers; no signage; no watermark
Avoid: visible face, celebrity likeness, logos, trademarks, recognizable arena or jersey, swollen or graphic injury, blood, surgery, medical illustration, anatomy overlay, knee brace, ankle sprain emphasis, vector art, painterly look, synthetic 3D render, excessive teal-orange grading
```

### `achilles-rupture-case-01.png`

```text
Use case: photorealistic-natural
Asset type: wide editorial case-study image for a professional Achilles-rupture sports medicine atlas
Primary request: Create an original photorealistic action photograph of generic acceleration from behind, emphasizing the instant of forceful plantar flexion through the Achilles tendon. Show an anonymous athlete, face not visible, beginning a hard sprint on an indoor training court; the rear lower legs, calves, heels, and Achilles contours must be the visual story.
Scene/backdrop: private dark-blue indoor performance court with minimal generic markings, shallow atmospheric depth, no spectators, no identifiable venue
Subject: one adult anonymous athlete, face not visible; full athletic stride viewed from directly behind and slightly low; plain unbranded deep-navy shorts and top, plain socks, generic unbranded shoes; natural physique and anatomically plausible calf-to-heel transition
Style/medium: dramatic high-end editorial sports photography, crisp photographic realism, realistic skin texture and sweat, fabric weave, rubber outsole texture, restrained fine grain; not illustration or CGI
Composition/framing: very wide landscape, approximately 5:2 aspect ratio. Athlete slightly right of center, rear view, legs and push-off foot prominent, enough environmental room to feel fast; head either outside the top crop or fully facing away. The Achilles tendon line above the heel is sharp and recognizable; controlled motion blur only in the far background and trailing limbs.
Lighting/mood: directional brand-blue court light with low-saturation shadows; warm amber/gold rim light catching one calf and heel; tense, decisive, premium sports-medicine editorial mood
Color palette: deep brand blue, slate, charcoal, muted natural skin, small warm gold/amber accents
Constraints: anonymous athlete, face not visible; original fictional moment; generic acceleration only; Achilles/calf/heel focus, not knee/ACL and not a lateral ankle-roll scene; one athlete; plain unbranded kit and footwear; no real player; no identifiable person; no real-event recreation; no NBA, team, league, sponsor, apparel, or shoe logos; no recognizable jersey design; no text; no numbers; no signage; no watermark
Avoid: visible face, celebrity likeness, branded shoe silhouette, recognizable uniforms or arenas, basketball in frame, ankle inversion, knee injury pose, gore, bruising, swollen tissue, anatomy overlay, brace, tape, illustration, vector art, overprocessed HDR, neon cyberpunk colors
```

### `achilles-rupture-case-02.png`

```text
Use case: photorealistic-natural
Asset type: wide clinical case-study image for a professional Achilles-rupture sports medicine atlas
Primary request: Create an original photorealistic sports-clinic photograph of a clinician performing a careful Achilles and calf examination on an anonymous athlete, face not visible. The athlete lies prone with the lower legs extending just beyond a padded treatment table; the clinician's hands perform a gentle calf-squeeze assessment while the Achilles tendon, heel, and resting foot angle remain clearly visible and anatomically plausible.
Scene/backdrop: refined private sports-medicine examination room, minimal equipment softly out of focus, no hospital branding, no screens or written charts
Subject: one adult anonymous athlete, face not visible, shown only from mid-thigh down in plain unbranded navy training shorts; one clinician represented mainly by natural hands and forearms in a plain charcoal clinical top, face entirely outside frame; bare calf, Achilles tendon, and heel as the focus
Style/medium: premium photorealistic editorial clinical photography, authentic skin texture and natural asymmetry, believable hand contact, realistic upholstery and fabric, shallow depth of field, subtle grain; not staged stock-photo gloss
Composition/framing: very wide landscape, approximately 5:2 aspect ratio; close side/rear three-quarter view along the treatment-table edge, both heel profiles visible but one examined calf dominant; clinician hands enter naturally from one side; no faces anywhere in frame
Lighting/mood: soft controlled clinical key light with deep low-saturation blue shadows; a restrained warm amber practical light or rim accent near the heel; calm, precise, trusted sports-medicine mood
Color palette: brand blue, slate, charcoal, desaturated skin tones, restrained warm gold/amber accent
Constraints: anonymous athlete, face not visible; original fictional clinical scene; accurate Achilles/calf/heel emphasis, not knee/ACL and not lateral ankle ligament evaluation; no graphic injury; plain unbranded garments; no real player; no identifiable person; no real-event recreation; no NBA, team, league, hospital, sponsor, apparel, or medical-device logos; no recognizable uniform design; no text; no labels; no signage; no watermark
Avoid: visible face, celebrity likeness, jersey, surgical scene, injection, wound, bruising, swelling, blood, diagnostic overlay, ultrasound screen, knee examination, ankle inversion test, logos, trademarks, medical illustration, vector art, waxy CGI skin, extra fingers, distorted hands or feet
```

### `achilles-rupture-case-03.png`

```text
Use case: photorealistic-natural
Asset type: wide rehabilitation case-study image for a professional Achilles-rupture sports medicine atlas
Primary request: Create an original photorealistic STRICT SIDE-PROFILE close-up of one mechanically correct eccentric heel-drop exercise. Show an anonymous athlete, face not visible. Exactly ONE lower leg and ONE bare foot are visible. The ball of that bare foot rests on the TOP of a raised rectangular rehab step, toes pointing left. The heel extends unsupported beyond the step's RIGHT edge and is slowly lowered BELOW the horizontal top surface. The Achilles tendon forms one clean, continuous anatomically plausible line from calf to heel. No second leg or second foot appears anywhere in frame.
Scene/backdrop: quiet high-performance rehabilitation studio, simple matte charcoal step clearly raised above a dark floor, sparse blurred background, no branding
Subject: one adult anonymous athlete, face not visible; exactly one leg cropped from below knee; exactly one bare foot in clean side profile; natural proportions, distinct calf, narrow Achilles tendon, heel and forefoot
Style/medium: premium photorealistic editorial sports-rehabilitation photography, genuine skin pores and fine body hair, realistic tendon contour and matte platform texture, shallow depth of field, restrained film grain; not illustration and not CGI
Composition/framing: very wide landscape, approximately 5:2 aspect ratio; camera exactly level with the step from the athlete's side. The step occupies the lower middle. The forefoot is visibly supported on top at left of the edge; the heel hangs in empty air to the right, below the top plane. Include clear negative air below and behind the heel so the movement is unambiguous. Crop out everything above lower calf.
Lighting/mood: sculpted brand-blue ambient light with low-saturation charcoal shadows; restrained warm gold/amber rim light tracing the one Achilles tendon and heel; controlled, patient, purposeful rehabilitation mood
Color palette: deep brand blue, slate, charcoal, muted natural skin, small warm gold/amber accent
Constraints: anonymous athlete, face not visible; original fictional rehab scene; exactly one leg and one foot; mechanically plausible eccentric heel drop; forefoot on top of step; unsupported heel lower than step top; Achilles/calf/heel focus, not knee/ACL and not lateral ankle; plain unbranded environment; no real player; no identifiable person; no real-event recreation; no NBA, team, league, sponsor, apparel, shoe, clinic, or equipment logos; no recognizable jersey design; no text; no numbers; no signage; no watermark
Avoid: visible face, celebrity likeness, any second leg, any second foot, doubled heel, overlapping anatomy, heel supported by platform, heel above step, whole foot on platform, foot touching the floor, ordinary flat-floor calf raise, ankle inversion, knee brace, shoe, sock, graphic injury, swelling, scar, wound, anatomy overlay, logos, trademarks, illustration, vector art, plastic CGI skin, impossible foot or toe geometry
```

### `achilles-rupture-case-04.png`

```text
Use case: photorealistic-natural
Asset type: wide detail case-study image for a professional Achilles-rupture sports medicine atlas
Primary request: Create an original photorealistic editorial detail photograph combining four tactile elements: a clearly contoured Achilles tendon, simple therapeutic tape, a generic unbranded training shoe, and the textured indoor court. Show an anonymous athlete, face not visible, seated just outside frame while one hand finishes securing a plain shoe; a restrained strip of neutral warm-tan sports tape follows the lower calf toward the Achilles without hiding the tendon.
Scene/backdrop: dark private indoor training court at floor level, subtle generic court line and fine surface texture, soft background falloff, no identifiable venue
Subject: one adult anonymous athlete, face not visible; only lower calf, taped Achilles region, heel, shoe, and one natural hand visible; plain navy sock rolled low enough for the tendon and tape to read; simple matte deep-navy shoe with absolutely no marks, branding, lettering, or recognizable signature design
Style/medium: premium macro-like editorial sports-medicine photography, truly photographic, realistic pores, fine body hair, tape fibers and slightly lifted tape edge, woven sock, matte synthetic shoe and gritty varnished court texture, shallow depth of field, restrained film grain; not product advertising, illustration, or CGI
Composition/framing: very wide landscape, approximately 5:2 aspect ratio; low intimate court-level close-up, Achilles and tape in sharp focus near center-left, shoe and hand occupying center-right, a small generic court line leading through the frame; face and torso fully absent
Lighting/mood: deep brand-blue ambient anchor with low-saturation shadows; narrow warm gold/amber sidelight grazing the tape, heel, lace, and court grain; quiet pre-return tension, precise and premium
Color palette: brand blue, slate, charcoal, desaturated skin, neutral tan tape, restrained warm gold/amber highlight
Constraints: anonymous athlete, face not visible; original fictional preparation detail; Achilles/calf/heel focus, not knee/ACL and not ankle-sprain taping; tasteful minimal tape, no visible wound; plain unbranded kit, tape, sock, and footwear; no real player; no identifiable person; no real-event recreation; no NBA, team, league, sponsor, apparel, shoe, tape, or court logos; no recognizable jersey or footwear design; no text; no numbers; no signage; no watermark
Avoid: visible face, celebrity likeness, branded or signature sneaker, swooshes, stripes, emblems, lettering, ankle-inversion support wrap, bulky brace, cast, surgery, scar, blood, bruising, swelling, anatomy overlay, ball, logos, trademarks, vector art, illustration, plastic CGI materials, distorted hand, extra fingers, excessively orange cinematic grade
```
