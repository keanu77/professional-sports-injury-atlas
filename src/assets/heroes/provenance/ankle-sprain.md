# Ankle-sprain image provenance

## Generation record

- Generation date: 2026-08-09
- Generator: OpenAI built-in `imagegen`
- Mode: text-to-image generation; no input or reference images
- Originality: all five images were generated de novo for this project from the prompts recorded below. They do not depict or intentionally imitate an identifiable real athlete, team, league, venue, or real sporting event, and they were not derived from stock photography or team/league media.

## Final assets

| Final path                                    |  Dimensions |       File size | SHA-256                                                            |
| --------------------------------------------- | ----------: | --------------: | ------------------------------------------------------------------ |
| `src/assets/heroes/ankle-sprain-overview.png` | 2400x720 px | 1,398,969 bytes | `f92167e9bcbaaf745843efb1d2cd24eb63f105889c38d6cf5931b4302529a0e9` |
| `src/assets/heroes/ankle-sprain-case-01.png`  | 2400x960 px | 2,108,627 bytes | `30edc84ba131fa068214be49e3688894ef0cf83e773520e0131f8867d85522eb` |
| `src/assets/heroes/ankle-sprain-case-02.png`  | 2400x960 px | 2,234,052 bytes | `b8ce93d3862b17b5f5fe7911c48fbab15574ce26eab598809de9767e3c7a12b1` |
| `src/assets/heroes/ankle-sprain-case-03.png`  | 2400x960 px | 2,209,969 bytes | `68a0e76730fd3922e785af502aaf7ff7ce866250cbd144b9255129168852b139` |
| `src/assets/heroes/ankle-sprain-case-04.png`  | 2400x960 px | 2,360,616 bytes | `cf45e134c69c1cd20785758549930cef52dc8896b1e79864db04e13da2a6f8ae` |

## Editorial and trademark redlines

- Every prompt explicitly requires: `anonymous athlete, face not visible`.
- No identifiable real player or celebrity likeness.
- No NBA, team, league, sponsor, manufacturer, clinic, venue, apparel, shoe, or other trademark/logo.
- Plain, unbranded kit, footwear, equipment, and clinical environment; no recognizable jersey design.
- Original fictional scenes only; no recreation of a real event.
- No text, letters, numbers, signage, or watermark.
- Final visual inspection confirmed that faces remain outside the frame and no visible marks conflict with these redlines.

## Processing and crop record

- Only the final delivery assets are retained in the repository.
- Overview source: 1927x816 px. It received a centered `cover` crop to the 10:3 delivery aspect ratio (equivalent to approximately a 1927x578 px centered source region, about 119 px removed from both top and bottom), preserving the athlete in the rightmost approximately 35-40% and calm negative space on the left. It was then resampled to 2400x720 px.
- Case sources: 1983x793 px each. Their generated framing was already effectively 5:2; centered `cover` processing removed at most the minimal approximately one-pixel horizontal edge required for an exact 5:2 ratio, then resampled each image to 2400x960 px.
- Resampling used Sharp with the Lanczos3 kernel, `fit: cover`, and centered positioning. Finals were encoded as sRGB RGB PNGs with compression level 9 and adaptive filtering; no alpha channel was added.
- Crop and resampling were performed as separate nondestructive processing passes before the final delivery files were written.

## Exact final prompts

### `ankle-sprain-overview.png`

```text
Use case: photorealistic-natural
Asset type: ultra-wide website hero photograph for a physician-facing sports injury atlas
Primary request: Create an original dramatic editorial sports-medicine photograph about a lateral ankle sprain risk during a hard cutting step on an indoor court.
Scene/backdrop: anonymous modern indoor training court, deep softly defocused court and wall planes, no spectators, no signage, no real event.
Subject: one adult anonymous athlete, face not visible, seen from behind and framed from mid-torso downward, wearing a plain unbranded charcoal and deep-navy training kit and plain unbranded shoes, captured at the instant of a forceful lateral plant and change of direction; the planted ankle and shoe are anatomically plausible and are the sharp focal point, with restrained athletic tape visible, no gore.
Style/medium: photorealistic premium editorial sports photography, credible real skin and fabric texture, subtle film grain, captured-in-the-moment realism, not CGI and not illustration.
Composition/framing: design specifically as a very wide 10:3 panoramic banner; keep the athlete and all meaningful action entirely within the rightmost 40 percent of the frame, ankle near the lower-right third; reserve the full left 60 percent as calm, uncluttered, dark brand-blue negative space suitable for overlaid page copy; face fully outside the frame; low courtside camera angle; make the central horizontal band crop-safe.
Lighting/mood: dramatic controlled arena-style side light, brand-blue anchor, low-saturation cool shadows, one restrained warm-orange rim-light accent, serious clinical editorial mood.
Color palette: deep brand blue, muted charcoal, low-saturation slate, subtle warm orange highlight only.
Constraints: anonymous athlete, face not visible; original fictional scene; no identifiable real player; no NBA, team, league, sponsor, manufacturer, or venue logos; no recognizable jersey design; plain unbranded kit and footwear; no real-event recreation; no text; no letters; no numbers; no signage; no watermark.
Avoid: vector art, illustration, 3D-render look, celebrity likeness, face, crowd, branded shoes, branded clothing, anatomy errors, duplicated limbs, gore, exaggerated injury, clutter in the left negative space.
```

### `ankle-sprain-case-01.png`

```text
Use case: photorealistic-natural
Asset type: wide editorial case photograph for a physician-facing sports injury atlas
Primary request: Create an original high-energy sports photograph showing a generic lateral cutting step from behind, with the ankle and shoe clearly carrying the visual story of ankle-sprain risk.
Scene/backdrop: empty anonymous indoor hardwood practice court with softly blurred deep-blue wall planes and one simple warm-orange court line, no spectators, no signage, no real game.
Subject: one adult anonymous athlete, face not visible, viewed from behind from the waist down in a plain unbranded deep-navy and charcoal training kit and plain unbranded shoes, taking an abrupt lateral change-of-direction step; rear three-quarter view; planted foot and lateral ankle sharply focused, subtle ankle tape, realistic joint position and body mechanics, no fall and no gore.
Style/medium: photorealistic documentary/editorial sports photography, real skin pores, fabric weave and court grain, natural motion blur in the trailing leg, subtle film grain, not CGI and not illustration.
Composition/framing: very wide 5:2 landscape banner, low rear tracking-camera viewpoint, planted ankle on the right-center third, full shoe visible, movement reads diagonally across frame, crop-safe central horizontal band; composition is active rather than the calm-left hero layout.
Lighting/mood: dramatic brand-blue ambient light, low-saturation cool shadows, restrained warm-orange sidelight reflected from the court, urgent but clinically credible.
Color palette: brand blue anchor, charcoal and slate, desaturated shadows, small warm-orange accent.
Constraints: anonymous athlete, face not visible; original fictional scene; no identifiable real player; no NBA, team, league, sponsor, manufacturer, or venue logos; no recognizable jersey design; plain unbranded kit and footwear; no real-event recreation; no text; no letters; no numbers; no watermark.
Avoid: emphasis on the knee or Achilles tendon, frontal portrait, visible face, branded shoe silhouette, celebrity likeness, crowd, gore, extreme deformity, duplicated limbs, anatomy errors, vector art, illustration, 3D-render look.
```

### `ankle-sprain-case-02.png`

```text
Use case: photorealistic-natural
Asset type: wide clinical case photograph for a physician-facing sports injury atlas
Primary request: Create an original medically credible close editorial photograph of a lateral ankle examination after a sports sprain.
Scene/backdrop: quiet contemporary sports-medicine examination room, deep brand-blue treatment table and softly defocused neutral cabinetry, no signage, no devices with labels.
Subject: one adult anonymous athlete, face not visible, seated with only the lower leg and bare foot in frame; a clinician whose face is also completely outside the frame uses two natural hands to gently palpate the lateral ankle near the anterior talofibular ligament and stabilize the heel; mild realistic swelling only, intact skin, no gore; plain unbranded charcoal shorts and a folded unbranded sock nearby.
Style/medium: photorealistic premium clinical editorial photography, anatomically credible hands and ankle, real skin texture and subtle pores, restrained retouching, shallow depth of field, not CGI and not illustration.
Composition/framing: very wide 5:2 landscape banner, intimate three-quarter close-up from knee to toes, examined ankle centered slightly right, clinician forearms entering naturally from the left, all fingers and toes anatomically plausible, crop-safe central horizontal band.
Lighting/mood: soft controlled window light with a brand-blue ambient anchor, low-saturation shadows, one subtle warm-orange practical-light accent, calm precise sports-medicine mood.
Color palette: deep brand blue, muted slate and skin tones, low-saturation shadows, restrained warm orange highlight.
Constraints: anonymous athlete, face not visible; original fictional clinical scene; no identifiable real person; no NBA, team, league, sponsor, clinic, manufacturer, or apparel logos; no recognizable jersey design; plain unbranded kit; no real-event recreation; no text; no letters; no numbers; no watermark.
Avoid: face, portrait, team memorabilia, branded equipment, needles, surgery, open wound, bruising exaggeration, gore, ankle deformity, extra fingers, fused fingers, extra toes, anatomy errors, vector art, illustration, 3D-render look.
```

### `ankle-sprain-case-03.png`

```text
Use case: photorealistic-natural
Asset type: wide rehabilitation case photograph for a physician-facing sports injury atlas
Primary request: Create an original close editorial sports-medicine photograph of controlled ankle-balance rehabilitation, visibly distinct from knee or Achilles rehabilitation imagery.
Scene/backdrop: quiet unbranded sports rehabilitation gym with a matte deep-blue floor, softly defocused neutral equipment, and a small out-of-focus warm-orange marker in the background, no signage.
Subject: one adult anonymous athlete, face not visible, framed only from just below the knee to the toes, balancing barefoot on one leg on a plain textured blue foam stability pad; anterior-lateral three-quarter view clearly shows the lateral ankle muscles making small stabilizing corrections; toes naturally engaged, other foot hovering out of focus behind, plain unbranded charcoal shorts barely at the top edge, no brace and no gore.
Style/medium: photorealistic premium editorial sports-clinic photography, anatomically accurate foot and ankle, real skin texture, fine pad texture, shallow depth of field and subtle film grain, not CGI and not illustration.
Composition/framing: very wide 5:2 landscape banner, low close camera at ankle height, working foot centered slightly right with the whole foot and toes visible, clean negative space on the left, crop-safe central horizontal band.
Lighting/mood: soft directional brand-blue ambient light, low-saturation cool shadows, restrained warm-orange rim highlight, disciplined and hopeful rehabilitation mood.
Color palette: brand-blue anchor, muted charcoal and natural skin, low-saturation slate shadows, tiny warm-orange accent.
Constraints: anonymous athlete, face not visible; original fictional scene; no identifiable real person; no NBA, team, league, sponsor, clinic, manufacturer, or apparel logos; no recognizable jersey design; plain unbranded kit and equipment; no real-event recreation; no text; no letters; no numbers; no watermark.
Avoid: posterior Achilles emphasis, knee-focused exercise, resistance-machine branding, visible face, celebrity likeness, extra toes, fused toes, deformed ankle, exaggerated swelling, gore, vector art, illustration, 3D-render look.
```

### `ankle-sprain-case-04.png`

```text
Use case: photorealistic-natural
Asset type: wide editorial detail photograph for a physician-facing sports injury atlas
Primary request: Create an original tactile sports photograph centered on the physical details of ankle taping, an unbranded court shoe, and a hardwood court before returning to play.
Scene/backdrop: anonymous empty indoor hardwood practice court at the sideline, visible wood grain and a single restrained warm-orange painted line, deep brand-blue falloff in the distant background, no spectators and no signage.
Subject: one adult anonymous athlete, face not visible, with only hands, lower shin, ankle and foot in frame; seated just outside frame while finishing clean beige athletic tape around the lateral ankle above a plain unbranded matte charcoal court shoe; realistic hand placement, tape layers and lace texture; ankle and shoe rest beside the orange court line; intact skin, no gore.
Style/medium: photorealistic premium editorial sports-detail photography, tactile fabric, tape, rubber and wood textures, subtle sweat and wear, shallow depth of field, subtle film grain, not a product advertisement, not CGI and not illustration.
Composition/framing: very wide 5:2 landscape banner, intimate low macro-like three-quarter crop, taped lateral ankle and shoe dominating the right-center, natural hands entering from upper right, rich court texture extending left, crop-safe central horizontal band.
Lighting/mood: dramatic brand-blue ambient anchor, low-saturation shadows, restrained warm-orange reflected edge light from the court line, focused pre-return-to-play mood.
Color palette: deep brand blue and muted charcoal, beige tape, desaturated wood, small warm-orange accent.
Constraints: anonymous athlete, face not visible; original fictional scene; no identifiable real player; no NBA, team, league, sponsor, manufacturer, shoe, apparel, or venue logos; no recognizable jersey or shoe design; plain unbranded kit and footwear; no real-event recreation; no text; no letters; no numbers; no watermark.
Avoid: product-brand composition, visible face, celebrity likeness, logo-like shoe marks, medical labels, open wound, gore, extreme swelling, extra fingers, fused fingers, extra toes, anatomy errors, emphasis on knee or Achilles tendon, vector art, illustration, 3D-render look.
```
