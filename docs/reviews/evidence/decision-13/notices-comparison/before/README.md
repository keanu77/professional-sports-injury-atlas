# Decision 13 representative before-layout evidence

These matched-viewport captures supplement the canonical semantic DOM corpus.
They were captured from the exact Phase 3 review `dist` at accepted Phase 3
commit `fd8bbe20e72e6bb67d797d68c156d899e4dfda35`, before any Phase 4
product-source edit. Third-party photo pixels are masked; notice and credit
layout remains visible.

- Viewports: 1440×900 and 390×844.
- Routes: licensed-photo case, original-SVG case, injury overview, and quarterly
  update.
- Exact routes: `/cases/kevin-durant-achilles-rupture-2019/`,
  `/cases/anthony-edwards-ankle-sprain-2023/`,
  `/injuries/achilles-rupture/`, and `/updates/2026-q3/`.
- Service workers were blocked and every non-local request was aborted.
- Each PNG is paired with the exact `<main>` outerHTML used for comparison.
