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

test("Curry review records the approved events and links their separate catalog pages", async ({
  page,
}) => {
  await page.goto("/review-candidates/stephen-curry/");
  await expect(page.locator("[data-candidate-review]")).toContainText(
    "三個事件內容已審核",
  );
  await expect(page.locator("article section")).toHaveCount(3);
  await expect(page.locator("[data-curry-catalog-link]")).toHaveCount(3);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expectNoAxeViolations(page);
});

for (const [slug, duration] of [
  ["stephen-curry-2026-right-patellofemoral-pain", "16:30"],
  ["tony-hawk-2022-femur", "56:02"],
]) {
  test(`${slug} offers a text route without inventing a teaching timestamp`, async ({
    page,
  }) => {
    await page.goto(`/videos/${slug}/`);
    await expect(page.locator(".clip-player")).toContainText(
      `影片全長 ${duration}`,
    );
    const guide = page.locator("[data-watch-guide]");
    await expect(guide).toContainText("尚未整理核心片段時間碼");
    await expect(page.locator("#clip-segments")).toHaveCount(0);
    await guide.getByRole("link", { name: "先讀影片文字重點" }).click();
    await expect(page.locator("#clip-highlights")).toBeInViewport();
    await guide.getByRole("link", { name: "查看傷勢與後續來源" }).click();
    await expect(page.locator("#clip-follow-up")).toBeInViewport();
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 720 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expectNoAxeViolations(page);
  });
}

test("Watkins timeline links the official recap without attributing a ligament diagnosis to it", async ({
  page,
}) => {
  await page.goto("/videos/juju-watkins-2025-knee/");
  await expect(page.locator("#clip-follow-up")).toContainText(
    "該報導未指明受傷側別或韌帶名稱",
  );
  await expect(
    page.getByRole("link", {
      name: /USC Athletics：對 Mississippi State 賽後報導/,
    }),
  ).toHaveAttribute(
    "href",
    "https://usctrojans.com/news/2025/3/24/womens-basketball-no-1-seed-usc-womens-basketball-scores-sweet-sixteen-spot-with-96-59-win-over-bulldogs",
  );
});
