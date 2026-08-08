# ACL hero image provenance

## Generation record

- Generation date: 2026-08-09
- Generation mode: OpenAI built-in `imagegen`
- Input images: none
- Originality: All five images were generated specifically for this project from the original prompts recorded below. They depict fictional, non-identifiable anonymous athletes and do not copy or recreate any real player, team, league, venue, jersey, photograph, or sporting event.

## Final assets

| Final path                           | Pixel dimensions | SHA-256                                                            |
| ------------------------------------ | ---------------: | ------------------------------------------------------------------ |
| `src/assets/heroes/acl-overview.png` |       2400 × 720 | `7704bc944a8781f6b07c1fe9acc542c6aed5ecb7427b72d6ea6789c80700fc9b` |
| `src/assets/heroes/acl-case-01.png`  |       2400 × 960 | `1eadfeab2babd48da41810f0e9f9a3bfa865d198d0077ad1fc71d298a937c50d` |
| `src/assets/heroes/acl-case-02.png`  |       2400 × 960 | `f8a48b36a4a056886f3c49fa794b5f7580daaa1580ce2085b5a2f549b4aa6953` |
| `src/assets/heroes/acl-case-03.png`  |       2400 × 960 | `ad5be2de623028b90614e09ed3811af93e36f2d0b0de32c60299d60d6460d4f8` |
| `src/assets/heroes/acl-case-04.png`  |       2400 × 960 | `8565ff1cfd55be4f0cf1732bfa2700144801051c8e8b7c75360f6a219bd8352e` |

## Portrait, trademark, and event redlines

- Every prompt literally requires: `anonymous athlete, face not visible`.
- No identifiable real player or other identifiable person.
- No NBA, team, league, sponsor, manufacturer, venue, hospital, institutional, or other trademarked logos or branding.
- Plain, unbranded athletic kit only; no recognizable jersey design, number, badge, emblem, or branded shoe design.
- No recreation of a real game, injury, photograph, broadcast, or other real sporting event.
- No text, signage, labels, or watermark in any image.

## Processing record

| Final asset        | Generated dimensions | Final processing                                                  |
| ------------------ | -------------------: | ----------------------------------------------------------------- |
| `acl-overview.png` |           1802 × 872 | Crop `1800 × 540` at `x=1, y=250`; Lanczos scale to `2400 × 720`. |
| `acl-case-01.png`  |          1536 × 1024 | Crop `1535 × 614` at `x=0, y=300`; Lanczos scale to `2400 × 960`. |
| `acl-case-02.png`  |           1983 × 793 | Crop `1980 × 792` at `x=1, y=0`; Lanczos scale to `2400 × 960`.   |
| `acl-case-03.png`  |           1983 × 793 | Crop `1980 × 792` at `x=1, y=0`; Lanczos scale to `2400 × 960`.   |
| `acl-case-04.png`  |           1983 × 793 | Crop `1980 × 792` at `x=1, y=0`; Lanczos scale to `2400 × 960`.   |

Processing used FFmpeg's Lanczos scaler. Only the final delivery assets are retained in the repository.

## Exact final prompts

### `acl-overview.png`

```text
Use case: photorealistic-natural
Asset type: ultra-wide website hero photograph for an ACL sports-injury atlas
Primary request: dramatic editorial sports-medicine photography of an ACL-specific pivot-and-deceleration moment on an indoor court; anonymous athlete, face not visible
Scene/backdrop: modern but completely unbranded indoor training court fading into deep brand-blue and low-saturation blue-gray shadows, with a clean softly textured court wall and floor; no signage
Subject: one adult athlete seen only from a rear three-quarter angle, face fully outside the frame or completely turned away, lowering into a controlled deceleration after a cutting movement, the planted knee and realistic lower-limb alignment are the visual focus; plain unbranded dark navy athletic kit and neutral shoes, no numbers, no badges
Style/medium: photorealistic high-end editorial sports medicine photograph, natural anatomy, real skin and fabric texture, subtle film grain, 35mm documentary lens character
Composition/framing: very wide panoramic frame; reserve the left approximately 60 percent as calm uncluttered negative space suitable for overlaid page copy; place the athlete and knee action entirely in the right approximately 40 percent; low court-level camera, subject large enough to read after a shallow panoramic crop, no face visible
Lighting/mood: dramatic controlled arena-style lighting, brand-blue dominant, low-saturation shadows, restrained warm orange and amber rim light around the athlete and knee, clinically observant rather than sensational
Color palette: deep brand blue, slate blue-gray, neutral skin and fabric, small warm orange/amber accents
Constraints: anonymous athlete, face not visible; original fictional non-identifiable person; no identifiable real player; no NBA, team, league, sponsor, manufacturer, or institutional logos; no recognizable jersey design; plain unbranded kit; no real-event recreation; no text; no watermark; no signage; no numbers; no emblems; no blood; anatomically plausible knee and limbs; no extra people
Avoid: vector art, illustration, CGI look, duplicated limbs, malformed hands, glamorized celebrity portrait, visible face, readable branding, typography
```

### `acl-case-01.png`

```text
Use case: photorealistic-natural
Asset type: wide ACL case-study editorial photograph
Primary request: original sports-medicine photograph of a generic field athlete performing a sharp but controlled cutting movement from behind; anonymous athlete, face not visible
Scene/backdrop: empty unbranded indoor performance field with a dark blue synthetic surface and soft atmospheric depth, no spectators, no signage
Subject: one adult athlete viewed from directly behind, face completely invisible, full lower body readable, hips rotating while one foot plants and the knee flexes during a lateral change of direction; plain unbranded cobalt-blue training top and charcoal shorts, neutral shoes without marks
Style/medium: photorealistic dramatic editorial sports photography with medical observation of realistic ACL loading mechanics, authentic fabric movement, skin texture, subtle film grain, fast shutter with a trace of natural motion at the trailing foot
Composition/framing: wide horizontal case header, low rear camera angle, athlete centered slightly right with generous environmental context, emphasize planted knee, hips, and foot alignment; enough vertical safety for a 2.5:1 crop
Lighting/mood: brand-blue dominant, low-saturation navy and slate shadows, narrow warm orange/amber sidelight tracing the planted leg, intense but controlled
Color palette: deep brand blue, cobalt, desaturated slate, charcoal, restrained amber highlights
Constraints: anonymous athlete, face not visible; original fictional non-identifiable person; no identifiable real player; no NBA, team, league, sponsor, manufacturer, or venue logos; no recognizable jersey design; plain unbranded kit; no real-event recreation; no text; no watermark; no signage; no jersey number; no emblem; anatomically plausible limbs and knee alignment; exactly one athlete
Avoid: visible face, portrait emphasis, vector art, illustration, CGI, crowds, branded shoes, uniforms that resemble a known club or national team, duplicated limbs, malformed anatomy, blood, sensational injury
```

### `acl-case-02.png`

```text
Use case: photorealistic-natural
Asset type: wide ACL clinical case-study editorial photograph
Primary request: an authentic sports-medicine clinician performing a careful Lachman test for anterior cruciate ligament assessment; anonymous athlete, face not visible
Scene/backdrop: refined unbranded sports medicine examination room with deep brand-blue walls fading softly out of focus, a plain charcoal examination table, no devices with labels and no signage
Subject: cropped view of one adult athlete lying supine in plain dark navy training shorts, shown only from mid-torso to feet so the face and identity are fully outside frame; one clinician is represented only by naturally positioned forearms and bare hands stabilizing the distal femur and proximal tibia at a realistically flexed knee for a Lachman examination; anatomically correct knee, skin, fingers, and clinical hand placement; no gloves unless natural
Style/medium: photorealistic high-end clinical editorial photography, sports medicine journal aesthetic, 50mm lens, shallow depth of field, real skin pores and subtle fabric texture, restrained film grain
Composition/framing: wide horizontal case header with the examined knee and clinician hands as the central focal point, waist-down crop, knee large and clear, contextual examination table extending across frame, safe composition for a 2.5:1 crop
Lighting/mood: precise soft clinical key light, brand-blue dominant environment and low-saturation shadows, restrained warm orange/amber edge light on the hands and lateral knee, calm expert confidence
Color palette: deep navy, desaturated steel blue, charcoal, natural skin tones, limited warm amber accents
Constraints: anonymous athlete, face not visible; athlete face entirely outside the image; clinician face and body outside the image except forearms and hands; original fictional non-identifiable people; no identifiable real player; no NBA, team, league, sponsor, manufacturer, hospital, or institutional logos; no recognizable jersey design; plain unbranded kit; no real-event recreation; no text; no watermark; no signage; no medical labels; anatomically plausible single knee and exactly two clinician hands; respectful non-sensational clinical scene
Avoid: visible faces, portrait, vector art, illustration, CGI, x-ray overlay, anatomy diagram, surgical scene, needles, blood, extra fingers, duplicated hands, malformed knee, branding, typography
```

### `acl-case-03.png`

```text
Use case: photorealistic-natural
Asset type: wide ACL rehabilitation case-study editorial photograph
Primary request: close-up sports rehabilitation training after ACL recovery, showing precise single-leg control with a resistance band; anonymous athlete, face not visible
Scene/backdrop: quiet unbranded high-performance rehabilitation gym with dark brand-blue floor and softly blurred navy equipment shapes, no mirrors showing faces, no signage
Subject: one adult athlete cropped from lower torso to shoes, face completely outside frame, balancing on one leg on a low matte blue foam pad while performing a controlled shallow single-leg squat; a plain amber resistance loop above the knees provides lateral tension; the working knee remains aligned over the foot, calf and quadriceps visibly engaged; plain unbranded navy shorts, dark top, neutral training shoes with no marks
Style/medium: photorealistic premium editorial sports-medicine photograph, intimate 70mm close-up, natural anatomy, authentic skin, fabric, rubber band and foam textures, subtle film grain
Composition/framing: wide horizontal case header, close crop dominated by the working knee, band, foot and balance pad; diagonal energy without showing the athlete's head; strong subject separation with safe space for a 2.5:1 crop
Lighting/mood: focused low-key gym lighting, brand-blue dominant and low-saturation shadows, the amber resistance band and a warm orange rim light provide restrained accents, disciplined and optimistic
Color palette: deep brand blue, midnight navy, desaturated slate, charcoal, warm amber/orange accents
Constraints: anonymous athlete, face not visible; face and identity entirely outside the image; original fictional non-identifiable person; no identifiable real player; no NBA, team, league, sponsor, manufacturer, gym, or institutional logos; no recognizable jersey design; plain unbranded kit; no real-event recreation; no text; no watermark; no signage; no numbers; anatomically plausible legs, knee, ankle, and feet; exactly one athlete; resistance loop appears functional and physically plausible
Avoid: visible face, portrait, vector art, illustration, CGI, branded shoes, impossible band path, duplicated legs, malformed feet, hyperextended knee, blood, surgical imagery, typography
```

### `acl-case-04.png`

```text
Use case: photorealistic-natural
Asset type: wide abstract-photographic ACL case-study editorial image
Primary request: a tactile, nearly abstract photographic study of a supported athletic knee, sports tape, and indoor court geometry; anonymous athlete, face not visible
Scene/backdrop: dark unbranded indoor court at rest, deep matte brand-blue floor with one restrained warm amber painted line and soft out-of-focus reflections, no signage
Subject: extreme close-up of one adult athlete's bent knee and upper shin near the court surface, identity entirely absent; two clean strips of plain dark-blue kinesiology tape follow the medial and lateral contours around the knee without forming letters or symbols; a neutral unbranded shoe and a small portion of charcoal shorts may dissolve into shadow; the real skin, tape weave, subtle perspiration and court grain become an abstract composition while remaining clearly photographic
Style/medium: photorealistic fine-art editorial sports medicine macro photograph, cinematic realism, 85mm macro lens feel, shallow depth of field, authentic material detail, subtle film grain
Composition/framing: wide horizontal case header; very low oblique angle with the knee occupying the left-center and diagonal court line leading toward deep blue negative space on the right; asymmetric, graphic, calm; safe for a 2.5:1 crop
Lighting/mood: sculpted brand-blue light, low-saturation cool shadows, a narrow warm orange/amber reflection brushing the tape edge and court line, contemplative and precise
Color palette: midnight brand blue, slate, charcoal, natural muted skin, limited amber/orange
Materials/textures: visible skin pores, woven elastic tape, matte rubber sole, finely grained court finish
Constraints: anonymous athlete, face not visible; face, head, and identity entirely outside the image; original fictional non-identifiable person; no identifiable real player; no NBA, team, league, sponsor, manufacturer, venue, or medical logos; no recognizable jersey design; plain unbranded kit; no real-event recreation; no text; no watermark; no signage; no numbers; tape has no writing and no logo; anatomically plausible single knee and leg
Avoid: visible face, portrait, vector art, illustration, CGI render, medical diagram, glowing anatomy overlay, letters or symbols made from tape, branded tape or shoe, duplicated limbs, malformed knee, injury gore, typography
```
