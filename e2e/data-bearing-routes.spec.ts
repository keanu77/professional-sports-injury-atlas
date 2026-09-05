/**
 * Data-bearing review fixture routes. The fictional review build proves the
 * production view templates: case detail with the classic label and the
 * separated diagnosis-confirmation/workflow states, the injury teaching
 * overview, the league listing, the quarterly update with the latest-update
 * link, and the complete single professional-note view. Axe also runs at
 * 200% zoom reflow.
 */

import { readdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

interface ExpectedCaseNotes {
  route: string;
  professional: [string, string, string, string];
}

interface CaseFile {
  slug: string;
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
const REMOVED_READER_LABEL = ["一般讀者", "筆記"].join("");
const REMOVED_LAYER_BLOCK = `[${["data", "layered", "notes"].join("-")}]`;
const REMOVED_LAYER_ATTRIBUTE = `[${["data", "layer"].join("-")}]`;
const REMOVED_LAYER_BUTTON = `[${["data", "layer", "button"].join("-")}]`;

async function expectProfessionalNotes(
  page: Page,
  expected: ExpectedCaseNotes,
): Promise<void> {
  await page.goto(expected.route);
  const professional = page.locator("[data-professional-notes]");

  await expect(professional).toHaveCount(1);
  await expect(professional.locator(":scope > h3")).toHaveText("專業筆記");
  await expect(professional.locator(":scope > h4")).toHaveText([
    ...PROFESSIONAL_HEADINGS,
  ]);
  await expect(professional.locator(":scope > p")).toHaveText(
    expected.professional,
  );
  await expect(
    page.getByText(REMOVED_READER_LABEL, { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(REMOVED_LAYER_BLOCK)).toHaveCount(0);
  await expect(page.locator(REMOVED_LAYER_ATTRIBUTE)).toHaveCount(0);
  await expect(page.locator(REMOVED_LAYER_BUTTON)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /筆記/u })).toHaveCount(0);
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

  test("review digests stay in the DOM inside a native closed disclosure", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");
    const disclosure = page.locator("details[data-review-digests]");
    const summary = disclosure.locator("summary");
    const recordId = disclosure.locator("[data-record-id]");
    const digestFields = disclosure.locator("input[data-review-digest-kind]");

    await expect(disclosure).toBeVisible();
    await expect(disclosure).not.toHaveAttribute("open", "");
    await expect(summary).toHaveText("審查識別與 digest");
    expect((await summary.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await expect(recordId).toBeAttached();
    await expect(recordId).toContainText("CASE-FIC-2014-901");
    await expect(digestFields).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      await expect(digestFields.nth(index)).toHaveAttribute("readonly", "");
      await expect(digestFields.nth(index)).not.toBeVisible();
    }

    const before = await digestFields.evaluateAll((fields) =>
      fields.map((field) => ({
        id: field.id,
        kind: field.getAttribute("data-review-digest-kind"),
        value: (field as HTMLInputElement).value,
      })),
    );
    expect(new Set(before.map(({ id }) => id)).size).toBe(3);
    expect(before.map(({ kind }) => kind)).toEqual([
      "case-content",
      "rendered-set",
      "follow-up",
    ]);
    for (const { id, value } of before) {
      expect(value).toMatch(/^[0-9a-f]{64}$/);
      await expect(disclosure.locator(`label[for="${id}"]`)).toHaveCount(1);
    }

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("open", "");
    for (let index = 0; index < 3; index += 1) {
      await expect(digestFields.nth(index)).toBeVisible();
    }
    await digestFields.first().selectText();
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
    expect(
      await digestFields.evaluateAll((fields) =>
        fields.map((field) => (field as HTMLInputElement).value),
      ),
    ).toEqual(before.map(({ value }) => value));
    await expectNoAxeViolations(page);

    await summary.focus();
    await page.keyboard.press("Space");
    await expect(disclosure).not.toHaveAttribute("open", "");
    expect(
      await digestFields.evaluateAll((fields) =>
        fields.map((field) => (field as HTMLInputElement).value),
      ),
    ).toEqual(before.map(({ value }) => value));
  });

  test("all 26 governed cases and the fixture render exactly one complete professional-note view", async ({
    page,
  }) => {
    expect(GOVERNED_CASE_NOTES).toHaveLength(26);
    for (const expected of [...GOVERNED_CASE_NOTES, FIXTURE_CASE_NOTES]) {
      await expectProfessionalNotes(page, expected);
    }
  });

  test("stays accessible at 200% zoom reflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto("/review/fixtures/case-detail/");
    await page.locator("details[data-review-digests] summary").click();
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
  });
});
