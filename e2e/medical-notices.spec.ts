/** Decision 13 medical-notice route matrix and initial-viewport proof. */

import { readdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  CANONICAL_MEDICAL_NOTICE_ZH_HANT,
  CENTRAL_NOTICES_MEDICAL_HREF,
  MEDICAL_NOTICE_MINIMUM_VISIBLE_CLAUSES,
} from "../src/lib/medical-notice";

const caseDirectory = new URL("../src/content/cases/", import.meta.url);
const CASE_PATHS = readdirSync(caseDirectory)
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => {
    const record = JSON.parse(
      readFileSync(new URL(name, caseDirectory), "utf8"),
    ) as { slug: string };
    return `/cases/${record.slug}/`;
  });

const CLINICAL_PATHS = [
  ...CASE_PATHS,
  "/injuries/acl/",
  "/injuries/ankle-sprain/",
  "/injuries/achilles-rupture/",
  "/updates/2026-q3/",
];

const NON_CLINICAL_PATHS = [
  "/",
  "/about/",
  "/source-policy/",
  "/credits-notices/",
  "/leagues/nba/",
  "/leagues/nba/page/2/",
  "/leagues/nba/page/3/",
  "/review/component-lab/",
  "/review/fixtures/case-detail/",
  "/review/fixtures/injury-overview/",
  "/review/fixtures/latest-update/",
  "/review/fixtures/league-listing/",
];

async function expectCanonicalFooter(page: Page): Promise<void> {
  const footer = page.locator('footer [data-medical-notice="footer"]');
  await expect(footer).toHaveCount(1);
  await expect(footer).toBeVisible();
  await expect(footer).toHaveText(CANONICAL_MEDICAL_NOTICE_ZH_HANT);
  await expect(
    page.locator("footer [data-central-notices-link]"),
  ).toHaveAttribute("href", CENTRAL_NOTICES_MEDICAL_HREF);
  await expect(page.locator("footer")).not.toContainText(
    "本站內容僅供教育參考，不構成醫療建議。",
  );
  await expect(page.locator("footer")).not.toContainText(
    "本站為教學用途之衛教內容，不構成醫療建議，亦不能取代醫師診察",
  );
}

test.describe("Decision 13 medical notices", () => {
  test("renders compact notices on exactly 26 cases, three overviews, and one update", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    expect(CASE_PATHS).toHaveLength(26);
    expect(CLINICAL_PATHS).toHaveLength(30);

    for (const path of CLINICAL_PATHS) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);

      const compact = page.locator('[data-medical-notice="compact"]');
      await expect(compact, path).toHaveCount(1);
      await expect(compact, path).toBeVisible();
      await expect(compact, path).toHaveText(CANONICAL_MEDICAL_NOTICE_ZH_HANT);
      for (const clause of MEDICAL_NOTICE_MINIMUM_VISIBLE_CLAUSES) {
        await expect(compact, `${path} ${clause}`).toContainText(clause);
      }

      const block = page.locator('[data-medical-notice-block="compact"]');
      await expect(
        block.locator("[data-central-notices-link]"),
        path,
      ).toHaveAttribute("href", CENTRAL_NOTICES_MEDICAL_HREF);
      expect(
        await block.evaluate(
          (element) => element.parentElement?.firstElementChild === element,
        ),
        `${path} compact notice must open the clinical container`,
      ).toBe(true);
      await expectCanonicalFooter(page);
      await expect(
        page.getByText(CANONICAL_MEDICAL_NOTICE_ZH_HANT, { exact: true }),
        path,
      ).toHaveCount(2);
    }

    for (const path of NON_CLINICAL_PATHS) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(
        page.locator('[data-medical-notice="compact"]'),
        path,
      ).toHaveCount(0);
      await expectCanonicalFooter(page);
      await expect(
        page.getByText(CANONICAL_MEDICAL_NOTICE_ZH_HANT, { exact: true }),
        path,
      ).toHaveCount(path === "/credits-notices/" ? 2 : 1);
    }
  });

  test("keeps every approved clause initially visible at desktop and 390px", async ({
    page,
  }) => {
    const representatives = [
      CASE_PATHS[0]!,
      "/injuries/acl/",
      "/updates/2026-q3/",
    ];
    const viewports = [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const path of representatives) {
        await page.goto(path);
        const compact = page.locator('[data-medical-notice="compact"]');
        await expect(compact, `${path} at ${viewport.width}px`).toBeVisible();
        const box = await compact.boundingBox();
        expect(box, `${path} at ${viewport.width}px`).not.toBeNull();
        expect(box!.y, `${path} at ${viewport.width}px`).toBeGreaterThanOrEqual(
          0,
        );
        expect(
          box!.y + box!.height,
          `${path} at ${viewport.width}px`,
        ).toBeLessThanOrEqual(viewport.height);
      }
    }
  });

  test("keeps the central medical deep-link target below the sticky header", async ({
    page,
  }) => {
    await page.goto(CLINICAL_PATHS[0]!);
    await page
      .locator(
        '[data-medical-notice-block="compact"] [data-central-notices-link]',
      )
      .click();
    await expect(page).toHaveURL(/\/credits-notices\/#medical-notice$/u);

    const [headerBox, targetBox] = await Promise.all([
      page.locator(".site-header").boundingBox(),
      page.locator("#medical-notice").boundingBox(),
    ]);
    expect(headerBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    expect(targetBox!.y).toBeGreaterThanOrEqual(
      headerBox!.y + headerBox!.height,
    );
  });
});
