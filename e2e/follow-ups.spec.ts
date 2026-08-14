import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const ATTRIBUTION =
  "以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。";
const EMPTY = "查無符合本政策且可逐條引用的紀錄；未據此推定未曾發生。";

test.describe("Decision 17 follow-up reports", () => {
  test("renders distinct approved lineage and pending atomic reports with complete source facts", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");
    const block = page.locator("[data-follow-up-block]");
    await expect(block).toBeVisible();
    await expect(block.locator("[data-follow-up-attribution]")).toHaveText(
      ATTRIBUTION,
    );

    const legacy = block.locator('[data-follow-up-lineage="approved-core"]');
    await expect(legacy.getByRole("heading")).toHaveText("既有 owner 核准內容");
    await expect(
      legacy.locator("[data-follow-up-legacy-statement]"),
    ).toContainText("虛構球團其後");
    await expect(legacy.locator("[data-source-tier]")).toContainText(
      "team-or-league-official",
    );

    const pending = block.locator("[data-follow-up-pending]");
    await expect(pending.getByRole("heading").first()).toHaveText(
      "新增後續消息：待醫師簽核",
    );
    await expect(block.locator("[data-follow-up-item]")).toHaveCount(2);
    await expect(
      block.locator('[data-review-status="pending-owner-signoff"]'),
    ).toHaveCount(2);
    await expect(block.locator("[data-follow-up-review-state]")).toHaveText([
      "待醫師簽核",
      "待醫師簽核",
    ]);

    for (const item of await block.locator("[data-follow-up-item]").all()) {
      await expect(
        item.locator("[data-follow-up-reporting-party]"),
      ).not.toBeEmpty();
      await expect(
        item.locator('[data-citation-context="follow-up"]'),
      ).toHaveCount(1);
      await expect(item.locator("[data-citation-title]")).not.toBeEmpty();
      await expect(item.locator("[data-citation-publisher]")).not.toBeEmpty();
      await expect(item.locator("[data-citation-date]")).toHaveAttribute(
        "datetime",
        /^\d{4}-\d{2}-\d{2}$/u,
      );
    }
    await expectNoAxeViolations(page);
  });

  test("keeps unverified NBA reporting literal, visibly unconfirmed, and pending", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");
    const item = page.locator(
      '[data-follow-up-item="fictional-treatment-unverified-001"]',
    );
    await expect(item).toHaveAttribute("data-source-tier", "unverified-report");
    await expect(item.locator("[data-follow-up-tier-label]")).toContainText(
      "未證實報導（unverified-report；不可視為已確認）",
    );
    await expect(item.locator("[data-follow-up-review-state]")).toHaveText(
      "待醫師簽核",
    );
    const citation = item.locator('[data-citation-context="follow-up"]');
    await expect(citation).toHaveAttribute(
      "data-link-policy",
      "nba-plain-text-citation",
    );
    await expect(citation.locator("[data-citation-url]")).toHaveText(
      "https://www.nba.com/news/fictional-unverified-treatment-901",
    );
    await expect(citation.locator("a")).toHaveCount(0);
    await expect(page.locator('a[href*="nba.com"]')).toHaveCount(0);
  });

  test("renders all four categories, exact empty states, and retrospective-only actual return", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");
    const block = page.locator("[data-follow-up-block]");
    await expect(block.locator("[data-follow-up-category]")).toHaveCount(4);
    await expect(block.locator("[data-follow-up-empty]")).toHaveText([
      EMPTY,
      EMPTY,
    ]);

    const actualReturn = block.locator(
      '[data-follow-up-category="actual-return"]',
    );
    await expect(
      actualReturn.locator("[data-actual-return-disclaimer]"),
    ).toContainText("已發生的參賽事實");
    await expect(
      actualReturn.locator("[data-actual-return-disclaimer]"),
    ).toContainText("不是治療時長、預後、建議");
    const item = actualReturn.locator("[data-follow-up-item]");
    await expect(item).toHaveAttribute(
      "data-source-tier",
      "team-or-league-official",
    );
    await expect(item.locator("[data-follow-up-fact-date]")).toHaveAttribute(
      "datetime",
      "2015-01-05",
    );
  });
});
