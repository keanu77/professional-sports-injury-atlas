/** Decision 13 medical-notice copy, placement, and route-matrix guard. */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_MEDICAL_NOTICE_ZH_HANT,
  CENTRAL_NOTICES_MEDICAL_HREF,
  MEDICAL_NOTICE_MINIMUM_VISIBLE_CLAUSES,
} from "../../src/lib/medical-notice";

const read = (path: string): string =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const component = read("src/components/notices/MedicalNotice.astro");
const footer = read("src/components/layout/SiteFooter.astro");
const centralNotices = read("src/pages/credits-notices.astro");

describe("Decision 13 canonical medical notice", () => {
  it("keeps the exact approved sentence and every minimum visible clause", () => {
    expect(CANONICAL_MEDICAL_NOTICE_ZH_HANT).toBe(
      "本站為教學用途的衛教內容，不構成醫療建議，也無法取代醫師診察。症狀持續或惡化請就醫。",
    );
    expect(MEDICAL_NOTICE_MINIMUM_VISIBLE_CLAUSES).toEqual([
      "教學用途",
      "不構成醫療建議",
      "無法取代醫師診察",
      "症狀持續或惡化請就醫",
    ]);
    for (const clause of MEDICAL_NOTICE_MINIMUM_VISIBLE_CLAUSES) {
      expect(CANONICAL_MEDICAL_NOTICE_ZH_HANT).toContain(clause);
    }
  });

  it("renders the approved text directly for both stable hooks", () => {
    expect(component).toContain("CANONICAL_MEDICAL_NOTICE_ZH_HANT");
    expect(component).toContain("data-medical-notice={variant}");
    expect(component).toContain("data-medical-notice-block={variant}");
    expect(component).not.toMatch(/\b(?:hidden|inert)\b|aria-hidden/u);
  });

  it("keeps the central explanation separate from the approved sentence", () => {
    expect(CENTRAL_NOTICES_MEDICAL_HREF).toBe(
      "/credits-notices/#medical-notice",
    );
    expect(component).toContain("data-central-notices-link");
    expect(component).toContain("CENTRAL_NOTICES_MEDICAL_HREF");
    expect(centralNotices).toContain("CANONICAL_MEDICAL_NOTICE_ZH_HANT");
    expect(centralNotices).toContain("data-canonical-medical-notice");
    expect(centralNotices).not.toContain(CANONICAL_MEDICAL_NOTICE_ZH_HANT);
  });
});

describe("Decision 13 medical-notice route matrix", () => {
  const compactTemplates = [
    "src/pages/cases/[slug].astro",
    "src/pages/injuries/[injury].astro",
    "src/pages/updates/[quarter].astro",
  ];
  const excludedTemplates = [
    "src/pages/index.astro",
    "src/pages/about.astro",
    "src/pages/source-policy.astro",
    "src/pages/injuries/[injury]/page/[page].astro",
    "src/pages/leagues/[league].astro",
    "src/pages/leagues/[league]/page/[page].astro",
    "src/pages/review/[lab].astro",
    "src/pages/review/fixtures/[fixture].astro",
  ];

  it("places one compact component only in the three approved templates", () => {
    for (const path of compactTemplates) {
      const source = read(path);
      expect(
        source.match(/<MedicalNotice variant="compact" \/>/gu),
        path,
      ).toHaveLength(1);
    }
    for (const path of excludedTemplates) {
      expect(read(path), path).not.toContain("MedicalNotice");
    }
  });

  it("makes the compact block the opening child of each clinical template", () => {
    expect(read(compactTemplates[0]!)).toMatch(
      /<article[\s\S]*?>\s*<MedicalNotice variant="compact" \/>\s*<EditorialHero/u,
    );
    expect(read(compactTemplates[1]!)).toMatch(
      /<div class="injury-page"[^>]*>\s*<MedicalNotice variant="compact" \/>\s*<EditorialHero/u,
    );
    expect(read(compactTemplates[2]!)).toMatch(
      /<article data-atlas-view="quarterly-update"[^>]*>\s*<MedicalNotice variant="compact" \/>\s*<h1>/u,
    );
  });

  it("renders one canonical footer component and removes both old strings", () => {
    expect(footer.match(/<MedicalNotice variant="footer" \/>/gu)).toHaveLength(
      1,
    );
    expect(footer).not.toContain("本站內容僅供教育參考，不構成醫療建議。");
    expect(footer).not.toContain(
      "本站為教學用途之衛教內容，不構成醫療建議，亦不能取代醫師診察",
    );
  });

  it("preserves the About page byte-for-byte", () => {
    const about = read("src/pages/about.astro");
    expect(createHash("sha256").update(about).digest("hex")).toBe(
      "77ccbc5cc21899c4de2e0931fcb6b69642bc49461e181bc472365824b78555f3",
    );
  });
});
