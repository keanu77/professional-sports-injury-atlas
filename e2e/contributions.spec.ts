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
    await expect(page.locator("[data-contribution-status]")).toContainText(
      message,
    );
    await expect(page.getByLabel("補充說明（選填）")).toHaveValue(
      "請協助查核這個影片",
    );
    await expect(page.locator("[data-contribution-thanks]")).toBeHidden();
    expect(
      await page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("atlas-contribution-draft:v1")!)
            .deliveryUncertain,
      ),
    ).toBe(error === "verification-unavailable");
    if (error !== "verification-unavailable") {
      await expect(
        page.getByRole("button", { name: "我已確認仍需重試" }),
      ).toBeHidden();
      await expect(
        page.getByRole("button", { name: "送出", exact: true }),
      ).toBeEnabled();
    }
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
  await expect(page.locator("[data-contribution-status]")).toContainText(
    "目前無法確認訊息送出",
  );
  await expect(page.getByLabel("需要修正的內容與建議")).toHaveValue(
    "建議重新確認回場日期",
  );
  await expect(page.locator("[data-contribution-thanks]")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "我已確認仍需重試" }).click();
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
    await expect(page.locator("[data-contribution-status]")).toContainText(
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
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "放大字級" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("preserves input and distinguishes an HTML gateway failure from a disconnected network", async ({
  page,
}) => {
  await page.route("**/api/contributions", (route) =>
    route.fulfill({
      status: 502,
      contentType: "text/html",
      body: "<h1>Bad gateway</h1>",
    }),
  );
  await page.goto("/contribute/");
  await page.getByLabel("補充說明（選填）").fill("請確認寄信服務");
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(page.locator("[data-contribution-status]")).toContainText(
    "寄信服務暫時無法回應",
  );
  await expect(page.getByLabel("補充說明（選填）")).toHaveValue(
    "請確認寄信服務",
  );
  await expect(page.locator("[data-contribution-thanks]")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "我已確認仍需重試" }),
  ).toBeVisible();
});

test("imaging literature retains unit context and returns to the course", async ({
  page,
}) => {
  const context = "https://hip-imaging-course.pages.dev/?tab=course#ch1-u1";
  await page.route("**/api/contributions", async (route) => {
    const data = route.request().postDataJSON();
    expect(data.type).toBe("reference");
    expect(data.contextUrl).toBe(context);
    expect(data.sources).toBe("https://pubmed.ncbi.nlm.nih.gov/1234/");
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto("/contribute/?context=" + encodeURIComponent(context));
  await expect(
    page.getByRole("heading", { name: "推薦影片與參考文獻" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "回到影像課程" }),
  ).toHaveAttribute("href", context);
  await page.getByRole("radio", { name: "參考文獻", exact: true }).check();
  await page.getByLabel("補充說明（選填）").fill("補充 MRI 判讀資料");
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("參考來源（選填）")
    .fill("https://pubmed.ncbi.nlm.nih.gov/1234/");
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(page.locator("[data-contribution-thanks]")).toBeVisible();
  await expect(page.getByRole("link", { name: "繼續學習" })).toHaveAttribute(
    "href",
    context,
  );
});
test("unknown contribution context cannot change the return destination", async ({
  page,
}) => {
  await page.goto("/contribute/?context=https://evil.example/");
  await expect(page.locator("[data-contribution-context]")).toBeHidden();
  await expect(page.locator("[data-contribution-return]")).toHaveAttribute(
    "href",
    "/",
  );
});

test("links all correction field errors and clears each after correction", async ({
  page,
}) => {
  await page.goto("/contribute/");
  await page.getByRole("radio", { name: "資料修正" }).check();
  await page.getByLabel("需要修正的頁面網址").fill("not-a-url");
  await page.getByLabel("需要修正的內容與建議").fill("太短");
  await page.getByLabel("參考來源（選填）").fill("invalid source");
  for (const name of ["url", "note", "sources"]) {
    await expect(page.locator(`#contribution-${name}`)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.locator(`#contribution-${name}`)).toHaveAttribute(
      "aria-describedby",
      new RegExp(`contribution-${name}-error`),
    );
    await expect(page.locator(`#contribution-${name}-error`)).toBeVisible();
  }
  await page
    .locator('[data-contribution-errors] a[href="#contribution-note"]')
    .click();
  await expect(page.getByLabel("需要修正的內容與建議")).toBeFocused();
  await page
    .getByLabel("需要修正的頁面網址")
    .fill("https://injury.sportsmedicine.tw/");
  await page.getByLabel("需要修正的內容與建議").fill("請重新確認來源日期");
  await page.getByLabel("參考來源（選填）").fill("");
  await expect(page.locator("[data-contribution-errors]")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeEnabled();
  await expectNoAxeViolations(page);
});

test("activates correction error links with Enter without losing focus", async ({
  page,
}) => {
  await page.goto("/contribute/");
  await page.getByRole("radio", { name: "資料修正" }).check();
  await page.getByLabel("需要修正的頁面網址").fill("not-a-url");
  await page.getByLabel("需要修正的內容與建議").fill("太短");
  await page.getByLabel("參考來源（選填）").fill("invalid source");
  const summary = page.locator("[data-contribution-errors]");
  const noteError = summary.locator('a[href="#contribution-note"]');
  await noteError.focus();
  await expect(noteError).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("需要修正的內容與建議")).toBeFocused();
  await page.getByLabel("需要修正的內容與建議").fill("請重新確認來源日期");
  await expect(summary.locator('a[href="#contribution-note"]')).toHaveCount(0);
  await expect(summary.locator('a[href="#contribution-url"]')).toBeVisible();
  await expect(
    summary.locator('a[href="#contribution-sources"]'),
  ).toBeVisible();
});

for (const failure of ["network", "missing-api", "render-error"] as const) {
  test(`retries initial challenge ${failure} in place without losing draft`, async ({
    page,
  }) => {
    let loads = 0;
    let submissions = 0;
    await page.route("**/api/contributions", async (route) => {
      submissions++;
      await route.fulfill({ json: { ok: true } });
    });
    await page.route(
      "https://challenges.cloudflare.com/turnstile/v0/api.js*",
      async (route) => {
        loads++;
        if (loads === 1 && failure === "network") {
          await route.abort();
          return;
        }
        if (loads === 1 && failure === "missing-api") {
          await route.fulfill({
            contentType: "application/javascript",
            body: "/* API unavailable */",
          });
          return;
        }
        await route.fulfill({
          contentType: "application/javascript",
          body: `
        window.turnstile={render(el, options){
          if (${failure === "render-error"} && !window.__renderRetried) { window.__renderRetried=true;throw new Error('test render error'); }
          window.__challengeCallback=options.callback;
          setTimeout(()=>options.callback('test-token'),0);return 'test-widget';
        },reset(){setTimeout(()=>window.__challengeCallback('new-test-token'),0);}};
      `,
        });
      },
    );
    await page.goto("/contribute/");
    await page.getByLabel("補充說明（選填）").fill("保留這段公開影片說明");
    await expect(
      page.getByRole("button", { name: "重新載入安全驗證" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "送出", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "重新載入安全驗證" }).click();
    await expect(page.getByLabel("補充說明（選填）")).toHaveValue(
      "保留這段公開影片說明",
    );
    await expect(
      page.getByRole("button", { name: "送出", exact: true }),
    ).toBeEnabled();
    expect(submissions).toBe(0);
    expect(loads).toBe(failure === "render-error" ? 1 : 2);
  });
}

test("restores a same-tab correction draft without a token and clears it on confirmed success", async ({
  page,
}) => {
  await page.route("**/api/contributions", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.goto("/contribute/?page=%2F");
  await page.getByRole("radio", { name: "資料修正" }).check();
  await page.getByLabel("需要修正的內容與建議").fill("請查核這個公開來源");
  const saved = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("atlas-contribution-draft:v1")!),
  );
  expect(Object.keys(saved).sort()).toEqual([
    "deliveryUncertain",
    "note",
    "savedAt",
    "scope",
    "sources",
    "type",
    "url",
    "version",
  ]);
  expect(JSON.stringify(saved)).not.toMatch(
    /test-token|turnstileToken|website/,
  );
  await page.reload();
  await expect(page.getByRole("radio", { name: "資料修正" })).toBeChecked();
  await expect(page.getByLabel("需要修正的內容與建議")).toHaveValue(
    "請查核這個公開來源",
  );
  await expect(page.locator("[data-contribution-draft-status]")).toContainText(
    "已恢復",
  );
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(page.locator("[data-contribution-thanks]")).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("atlas-contribution-draft:v1"),
    ),
  ).toBeNull();
});

test("keeps an ambiguous delivery locked across reload until explicit retry", async ({
  page,
}) => {
  let submissions = 0;
  await page.route("**/api/contributions", async (route) => {
    submissions++;
    await route.fulfill({
      status: 502,
      headers: {
        "X-Contribution-Request-Id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      },
      json: { error: "delivery" },
    });
  });
  await page.goto("/contribute/");
  await page.getByLabel("補充說明（選填）").fill("請查核公開影片");
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(page.locator("[data-contribution-receipt]")).toContainText(
    "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  );
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel("補充說明（選填）")).toHaveValue(
    "請查核公開影片",
  );
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "我已確認仍需重試" }),
  ).toBeVisible();
  expect(submissions).toBe(1);
  await page.getByRole("button", { name: "我已確認仍需重試" }).click();
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeEnabled();
  expect(submissions).toBe(1);
});

test("locks a request interrupted by reload before its response until explicit retry", async ({
  page,
}) => {
  let submissions = 0;
  let respondToPending: (() => Promise<void>) | undefined;
  await page.route("**/api/contributions", (route) => {
    submissions++;
    // Hold the response so navigation can interrupt the original document.
    respondToPending = () => route.fulfill({ json: { ok: true } });
  });
  await page.goto("/contribute/");
  await page.getByLabel("補充說明（選填）").fill("回應前重新整理的投稿");
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect.poll(() => submissions).toBe(1);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("atlas-contribution-draft:v1")!)
          .deliveryUncertain,
    ),
  ).toBe(true);
  await page.reload();
  await respondToPending?.().catch(() => {
    // Reload may have already aborted the browser side of the original request.
  });
  await expect(page.getByLabel("補充說明（選填）")).toHaveValue(
    "回應前重新整理的投稿",
  );
  await expect(page.locator("[data-contribution-status]")).toContainText(
    "上次送出結果尚未確認",
  );
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("[data-contribution-thanks]")).toBeHidden();
  await page.getByRole("button", { name: "我已確認仍需重試" }).click();
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeEnabled();
  expect(submissions).toBe(1);
});

test("keeps an unconfirmed JSON success response locked for explicit retry", async ({
  page,
}) => {
  await page.route("**/api/contributions", (route) =>
    route.fulfill({ json: { ok: false } }),
  );
  await page.goto("/contribute/");
  await page.getByLabel("補充說明（選填）").fill("尚未確認成功的投稿");
  await page.getByRole("button", { name: "送出", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "我已確認仍需重試" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("[data-contribution-thanks]")).toBeHidden();
});

test("clears the draft and remains usable when session storage is unavailable", async ({
  page,
}) => {
  await page.goto("/contribute/");
  await page.getByLabel("補充說明（選填）").fill("暫存公開資料");
  await page.getByRole("button", { name: "清除本分頁草稿" }).click();
  await expect(page.getByLabel("補充說明（選填）")).toHaveValue("");
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("atlas-contribution-draft:v1"),
    ),
  ).toBeNull();
  await page.addInitScript(() =>
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    }),
  );
  await page.reload();
  await page.getByLabel("補充說明（選填）").fill("不儲存也可編輯");
  await expect(page.locator("[data-contribution-draft-status]")).toContainText(
    "無法暫存",
  );
  await expect(
    page.getByRole("button", { name: "送出", exact: true }),
  ).toBeEnabled();
});
