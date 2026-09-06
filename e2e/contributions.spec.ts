import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

test.beforeEach(async ({ page }) => {
  // No real challenge or email is sent by these browser tests.
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js*",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `let callback; window.turnstile={render(el, options){callback=options.callback;setTimeout(()=>callback('test-token'),0);return 'test-widget';},reset(){setTimeout(()=>callback('new-test-token'),0);}};`,
      }),
  );
});
test("accepts an anonymous video and shows thanks only after confirmation", async ({
  page,
}) => {
  let submissions = 0;
  await page.route("**/api/contributions", async (route) => {
    submissions++;
    const data = route.request().postDataJSON();
    expect(data.type).toBe("video");
    expect(data).not.toHaveProperty("email");
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto("/contribute/");
  await expect(page.locator('[type="email"]')).toHaveCount(0);
  await expect(page.locator("[data-contribution-thanks]")).toBeHidden();
  await page
    .getByLabel("公開影片網址")
    .fill("https://www.youtube.com/watch?v=test");
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(page.locator("[data-contribution-thanks]")).toBeVisible();
  await expect(page.locator("[data-contribution-form]")).toBeHidden();
  await expect(page.locator("[data-contribution-thanks]")).toBeFocused();
  expect(submissions).toBe(1);
});
test("prefills a correction, preserves text on failure, and allows retry", async ({
  page,
}) => {
  let submissions = 0;
  await page.route("**/api/contributions", async (route) => {
    submissions++;
    const data = route.request().postDataJSON();
    expect(data.type).toBe("correction");
    expect(data.url).toBe(
      "https://injury.sportsmedicine.tw/videos/chien-ming-wang-2008-foot/",
    );
    expect(data.note).toBe("建議重新確認回場日期");
    await route.fulfill({
      status: submissions === 1 ? 502 : 200,
      json: submissions === 1 ? { error: "delivery" } : { ok: true },
    });
  });
  await page.goto("/contribute/?page=%2Fvideos%2Fchien-ming-wang-2008-foot%2F");
  await page.getByRole("radio", { name: "資料修正" }).check();
  await expect(page.getByLabel("需要修正的內容與建議")).toHaveAttribute(
    "required",
    "",
  );
  await page.getByLabel("需要修正的內容與建議").fill("建議重新確認回場日期");
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("目前無法確認訊息送出");
  await expect(page.getByLabel("需要修正的內容與建議")).toHaveValue(
    "建議重新確認回場日期",
  );
  await expect(page.locator("[data-contribution-thanks]")).toBeHidden();
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(page.locator("[data-contribution-thanks]")).toBeVisible();
});
test("header and form reflow with large text and pass accessibility in both themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/contribute/");
  await expect(page.locator(".site-author")).toHaveAttribute(
    "href",
    "https://sportsmedicine.tw/",
  );
  await expect(page.locator(".site-contribute-link")).toBeVisible();
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: "深色模式" }).click();
    await expectNoAxeViolations(page);
  }
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "放大字級" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});
