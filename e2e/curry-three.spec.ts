import { expect, test } from "@playwright/test";
import curry from "../src/data/videos/curry-three.v1.json" with { type: "json" };
import { expectNoAxeViolations } from "./helpers/a11y";

test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_E2E_MODE !== "public-preview",
    "Public catalog preview",
  ),
);

test("Curry and Chinese aliases find three distinct events within 203 videos", async ({
  page,
}) => {
  await page.goto("/?q=柯瑞");
  await expect(page.locator("[data-discovery-slug]")).toHaveCount(203);
  const cards = page.locator("[data-discovery-slug]:visible");
  await expect(cards).toHaveCount(3);
  const slugs = await cards.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-discovery-slug")),
  );
  expect(slugs.sort()).toEqual(curry.clips.map((clip) => clip.slug).sort());
  await page.getByRole("searchbox").fill("Steph Curry");
  await expect(cards).toHaveCount(3);
});

for (const clip of curry.clips) {
  test(`${clip.slug} binds the correct player, thumbnail and event sources`, async ({
    page,
  }) => {
    const response = await page.goto(`/videos/${clip.slug}/`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Stephen Curry", exact: true }),
    ).toBeVisible();
    await expect(page.locator("[data-video-embed]")).toHaveAttribute(
      "data-video-id",
      clip.videoId,
    );
    await expect(
      page.locator(`[data-video-thumbnail="${clip.videoId}"]`).first(),
    ).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator(".return-days")).toHaveCount(0);
    await expect(page.locator("[data-recovery-timeline]")).toBeVisible();
    for (const reference of await page
      .locator('a[href^="#event-source-"]')
      .all()) {
      await expect(
        page.locator((await reference.getAttribute("href"))!),
      ).toHaveCount(1);
    }
    await expectNoAxeViolations(page);
  });
}
