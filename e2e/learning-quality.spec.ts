import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_E2E_MODE !== "public-preview",
    "Explicit draft preview only",
  ),
);

for (const path of [
  "/cases/tyrese-haliburton-achilles-rupture-2025/",
  "/videos/tony-hawk-2022-femur/",
]) {
  test(`${path} exposes review status, reading tasks and cited self-checks`, async ({
    page,
  }) => {
    await page.goto(path);
    const learning = page.locator("[data-video-learning]");
    await page.getByRole("link", { name: "閱讀與學習", exact: true }).click();
    const heading = learning.getByRole("heading", { name: "如何閱讀本頁" });
    await expect(heading).toBeInViewport();
    await expect(
      learning.getByRole("heading", { name: "如何閱讀本頁" }),
    ).toBeVisible();
    await expect(learning.locator("[data-learning-draft]")).toContainText(
      "待專業審閱",
    );
    await learning.locator("details").first().locator("summary").click();
    await expect(learning.locator("details").first()).toHaveAttribute(
      "open",
      "",
    );
    for (const reference of await learning
      .locator('a[href^="#event-source-"]')
      .all()) {
      await expect(
        page.locator((await reference.getAttribute("href"))!),
      ).toHaveCount(1);
    }
    await expectNoAxeViolations(page);
  });
}

test("Curry preview separates three events without claiming publication or embedded playback", async ({
  page,
}) => {
  await page.goto("/review-candidates/stephen-curry/");
  await expect(page.locator("[data-candidate-review]")).toContainText(
    "尚未列入公開目錄",
  );
  await expect(page.locator("article section")).toHaveCount(3);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expectNoAxeViolations(page);
});
