/**
 * Data-bearing review fixture routes. The fictional review build proves the
 * production view templates: case detail with the classic label and the
 * separated diagnosis-confirmation/workflow states, the injury teaching
 * overview, the league listing, the quarterly update with the latest-update
 * link, and the LayeredNotes native button group (aria-pressed emphasis,
 * both sections always readable, stable focus, Enter/Space activation).
 * Axe runs before and after each state change and at 200% zoom reflow.
 */

import { readdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

interface ExpectedCaseNotes {
  route: string;
  general: string;
  professional: [string, string, string, string];
}

interface CaseFile {
  slug: string;
  general: { whatVideoCannotProve: string };
  professional: {
    mechanismAnalysis: string;
    clinicalLimitations: string;
    differentialContext: string;
    treatmentAndRtpMeaning: string;
  };
}

const caseDirectory = new URL("../src/content/cases/", import.meta.url);
const GOVERNED_CASE_NOTES: ExpectedCaseNotes[] = readdirSync(caseDirectory)
  .filter((filename) => filename.endsWith(".json"))
  .sort()
  .map((filename) => {
    const record = JSON.parse(
      readFileSync(new URL(filename, caseDirectory), "utf8"),
    ) as CaseFile;
    return {
      route: `/cases/${record.slug}/`,
      general: record.general.whatVideoCannotProve,
      professional: [
        record.professional.mechanismAnalysis,
        record.professional.clinicalLimitations,
        record.professional.differentialContext,
        record.professional.treatmentAndRtpMeaning,
      ],
    };
  });

const FIXTURE_CASE_NOTES: ExpectedCaseNotes = {
  route: "/review/fixtures/case-detail/",
  general:
    "影片無法證明韌帶撕裂、合併半月板損傷或嚴重度；這些需要臨床檢查與影像學檢查。",
  professional: [
    "虛構分析：球員急減速並切入變向，膝關節在沒有外力接觸下向內塌陷。\n\n膝關節接近伸直位的非接觸切入，是文獻中討論前十字韌帶受傷時經典的可見負荷模式。",
    "影片觀察無法確認前十字韌帶撕裂，也無法分級任何合併損傷。",
    "半月板損傷與側副韌帶受累無法僅憑影片排除，需要影像學檢查。",
    "已發表的前十字韌帶恢復與回場討論強調以條件式進階為準，而非固定日期。",
  ],
};

const PROFESSIONAL_HEADINGS = [
  "機轉分析（觀察性）",
  "臨床限制",
  "鑑別脈絡",
  "治療與回場意涵",
] as const;

async function expectNarrowedLayeredNotes(
  page: Page,
  expected: ExpectedCaseNotes,
): Promise<void> {
  await page.goto(expected.route);
  const notes = page.locator("[data-layered-notes]");
  const general = notes.locator('[data-layer="general"]');
  const professional = notes.locator('[data-layer="professional"]');

  await expect(general.locator(":scope > h4")).toHaveText(["畫面不能證明什麼"]);
  await expect(general.locator(":scope > p")).toHaveText([expected.general]);
  await expect(professional.locator(":scope > h4")).toHaveText([
    ...PROFESSIONAL_HEADINGS,
  ]);
  await expect(professional.locator(":scope > p")).toHaveText(
    expected.professional,
  );
  await expect(notes.getByText("發生了什麼", { exact: true })).toHaveCount(0);
  await expect(notes.getByText("畫面看得到什麼", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    notes.getByText("已確認的後續更新", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "影片段落觀察", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("[data-video-timeline]")).toHaveCount(0);
}

test.describe("data-bearing fixture routes", () => {
  test("case detail renders the classic label and separated statuses", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");
    await expect(page.locator('[data-atlas-view="case-detail"]')).toBeVisible();

    // Classic cases always show the exact label plus a readable reason.
    const classic = page.locator("[data-classic-label]");
    await expect(classic).toContainText("經典案例");
    await expect(classic).toContainText("虛構教學示範");

    // External diagnosis confirmation and the private workflow badge are
    // distinct blocks; the workflow badge labels itself as non-diagnostic.
    const confirmation = page.locator(".case-confirmation").first();
    await expect(confirmation).toContainText("診斷確認狀態（外部來源）");
    const workflowBadge = page.locator("[data-review-badge]").first();
    await expect(workflowBadge).toContainText("內部審查工作流程狀態（非診斷）");
    await expect(workflowBadge).not.toContainText("診斷確認狀態");

    // Mechanism tags stay labeled as observation, never diagnosis.
    await expect(page.locator(".mechanism-tags")).toContainText(
      "觀察分類，非診斷",
    );
    await expectNoAxeViolations(page);
  });

  test("injury overview, league listing, and update fixture routes render", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/injury-overview/");
    await expect(
      page.locator('[data-atlas-view="injury-overview"]'),
    ).toBeVisible();
    await expect(page.locator("[data-injury-overview]")).toBeVisible();
    await expectNoAxeViolations(page);

    await page.goto("/review/fixtures/league-listing/");
    await expect(
      page.locator('[data-atlas-view="league-listing"]'),
    ).toBeVisible();
    expect(
      await page.locator("[data-static-listing] li").count(),
    ).toBeGreaterThan(0);
    await expectNoAxeViolations(page);

    await page.goto("/review/fixtures/latest-update/");
    await expect(
      page.locator('[data-atlas-view="quarterly-update"]'),
    ).toBeVisible();
    await expect(page.locator("[data-latest-update-link]")).toBeVisible();
    // Update transitions expose case IDs with their clinical digests.
    await expect(
      page
        .locator("article")
        .getByText(/clinical digest/)
        .first(),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("review pages expose IDs and copyable digests", async ({ page }) => {
    await page.goto("/review/fixtures/case-detail/");
    await expect(page.locator("[data-review-digests]")).toBeVisible();
    await expect(page.locator("[data-record-id]")).toContainText(
      "CASE-FIC-2014-901",
    );
    const digestValues = await page
      .locator(".digest-field")
      .evaluateAll((fields) =>
        fields.map((field) => (field as HTMLInputElement).value),
      );
    expect(digestValues.length).toBeGreaterThanOrEqual(2);
    for (const value of digestValues) {
      expect(value).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test("all 26 governed cases and the fixture render only the retained reader guardrail while preserving professional notes", async ({
    page,
  }) => {
    expect(GOVERNED_CASE_NOTES).toHaveLength(26);
    for (const expected of [...GOVERNED_CASE_NOTES, FIXTURE_CASE_NOTES]) {
      await expectNarrowedLayeredNotes(page, expected);
    }
  });

  test("LayeredNotes is an emphasis toggle, not a fake tab interface", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");
    const notes = page.locator("[data-layered-notes]");
    const generalButton = page.getByRole("button", {
      name: "一般讀者筆記",
    });
    const professionalButton = page.getByRole("button", {
      name: "專業筆記",
    });
    const general = page.locator('[data-layer="general"]');
    const professional = page.locator('[data-layer="professional"]');

    // Native button group: two type=button controls with unique
    // aria-controls and exactly one pressed state.
    await expect(generalButton).toHaveAttribute("type", "button");
    await expect(professionalButton).toHaveAttribute("type", "button");
    const generalControls = await generalButton.getAttribute("aria-controls");
    const professionalControls =
      await professionalButton.getAttribute("aria-controls");
    expect(generalControls).not.toBeNull();
    expect(professionalControls).not.toBeNull();
    expect(generalControls).not.toBe(professionalControls);
    expect(generalControls).toBe(await general.getAttribute("id"));
    expect(professionalControls).toBe(await professional.getAttribute("id"));
    await expect(notes.locator("[data-layer-button]")).toHaveCount(2);
    await expect(generalButton).toHaveAttribute("aria-pressed", "true");
    await expect(professionalButton).toHaveAttribute("aria-pressed", "false");
    await expect(notes).toHaveAttribute("data-emphasis", "general");
    const generalAccent = await general.evaluate(
      (element) => window.getComputedStyle(element).borderTopColor,
    );
    const professionalBase = await professional.evaluate(
      (element) => window.getComputedStyle(element).borderTopColor,
    );
    expect(generalAccent).not.toBe(professionalBase);
    await expectNoAxeViolations(page);

    // Click moves emphasis only: aria-pressed swaps, both sections remain
    // visible, and the handler never moves focus into either section.
    await professionalButton.click();
    await expect(professionalButton).toHaveAttribute("aria-pressed", "true");
    await expect(generalButton).toHaveAttribute("aria-pressed", "false");
    await expect(notes).toHaveAttribute("data-emphasis", "professional");
    await expect(general).toBeVisible();
    await expect(professional).toBeVisible();
    await expect
      .poll(() =>
        general.evaluate(
          (element) => window.getComputedStyle(element).borderTopColor,
        ),
      )
      .toBe(professionalBase);
    await expect
      .poll(() =>
        professional.evaluate(
          (element) => window.getComputedStyle(element).borderTopColor,
        ),
      )
      .toBe(generalAccent);
    const focusInsideLayer = await page.evaluate(() => {
      const active = document.activeElement;
      if (active === null) return false;
      return (
        active.closest('[data-layer="general"]') !== null ||
        active.closest('[data-layer="professional"]') !== null
      );
    });
    expect(focusInsideLayer).toBe(false);
    await expectNoAxeViolations(page);

    // Normal keyboard activation with Enter and Space keeps focus stable.
    await generalButton.focus();
    await page.keyboard.press("Enter");
    await expect(generalButton).toHaveAttribute("aria-pressed", "true");
    await expect(notes).toHaveAttribute("data-emphasis", "general");
    await expect(generalButton).toBeFocused();
    await professionalButton.focus();
    await page.keyboard.press("Space");
    await expect(professionalButton).toHaveAttribute("aria-pressed", "true");
    await expect(notes).toHaveAttribute("data-emphasis", "professional");
    await expect(professionalButton).toBeFocused();
    await expect(general).toBeVisible();
    await expect(professional).toBeVisible();
  });

  test("stays accessible at 200% zoom reflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto("/review/fixtures/case-detail/");
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      const main = document.querySelector("main");
      return {
        document: root.scrollWidth - root.clientWidth,
        main: main === null ? Number.NaN : main.scrollWidth - main.clientWidth,
      };
    });
    expect(overflow.document).toBeLessThanOrEqual(1);
    expect(overflow.main).toBeLessThanOrEqual(1);
    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "專業筆記" }).click();
    await expectNoAxeViolations(page);
  });
});
