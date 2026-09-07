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
for (const [status, error, message] of [
  [429, "ip-daily", "這個網路位址今天已達送出上限"],
  [429, "site-daily", "本站今天的通知額度已滿"],
  [429, "duplicate", "相同內容在 10 分鐘內已有送出紀錄"],
  [503, "guard-unavailable", "目前暫停送出"],
  [400, "verification-invalid", "安全驗證未通過"],
  [503, "verification-unavailable", "安全驗證服務暫時無法使用"],
] as const) {
  test(`retains input when ${error} blocks sending`, async ({ page }) => {
    await page.route("**/api/contributions", (route) =>
      route.fulfill({ status, json: { error } }),
    );
    await page.goto("/contribute/");
    await page.getByLabel("補充說明（選填）").fill("請協助查核這個影片");
    await page.getByRole("button", { name: "送出", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(message);
    await expect(page.getByLabel("補充說明（選填）")).toHaveValue(
      "請協助查核這個影片",
    );
    await expect(page.locator("[data-contribution-thanks]")).toBeHidden();
  });
}
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
  await expect(page.getByLabel("需要修正的頁面網址")).toHaveAttribute(
    "required",
    "",
  );
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
test("allows an empty video URL after switching back from correction", async ({
  page,
}) => {
  await page.route("**/api/contributions", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      type: "video",
      url: "",
    });
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto("/contribute/?page=%2F");
  await page.getByRole("radio", { name: "資料修正" }).check();
  await page.getByRole("radio", { name: "公開影片", exact: true }).check();
  await expect(page.getByLabel("公開影片網址（選填）")).not.toHaveAttribute(
    "required",
  );
  await expect(page.getByLabel("公開影片網址（選填）")).toHaveValue("");
  await page.getByLabel("補充說明（選填）").fill("請協助尋找相關公開影片");
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(page.locator("[data-contribution-thanks]")).toBeVisible();
});
test("empty and whitespace-only submissions never load Turnstile or contact the API", async ({
  page,
}) => {
  let challenges = 0;
  let submissions = 0;
  page.on("request", (request) => {
    if (request.url().includes("challenges.cloudflare.com")) challenges++;
    if (request.url().endsWith("/api/contributions")) submissions++;
  });
  await page.goto("/contribute/");
  for (const blank of ["", " \n　"]) {
    await page.getByLabel("補充說明（選填）").fill(blank);
    await page.getByLabel("參考來源（選填）").fill(blank);
    await page
      .locator("[data-contribution-form]")
      .evaluate((form: HTMLFormElement) => form.requestSubmit());
    await expect(page.getByRole("status")).toContainText(
      "至少提供公開影片網址、補充說明或有效參考來源其中一項",
    );
    expect(challenges).toBe(0);
    expect(submissions).toBe(0);
    await expect(
      page.getByRole("button", { name: "送出", exact: true }),
    ).toBeDisabled();
  }
});
test("legal source alone unlocks verification and sending", async ({
  page,
}) => {
  await page.route("**/api/contributions", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.goto("/contribute/");
  await page.getByLabel("參考來源（選填）").fill("not a URL");
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("參考來源（選填）").fill("https://example.org/report");
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
  await page.getByRole("button", { name: "主選單", exact: true }).click();
  await expect(
    page
      .getByRole("navigation", { name: "主導覽" })
      .getByRole("link", { name: "提供影片／資料修正" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  for (const theme of ["dark", "light"]) {
    if (theme === "light")
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
