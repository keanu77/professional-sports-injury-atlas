import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const PUBLIC_LAUNCH = process.env.ATLAS_PUBLIC_LAUNCH === "decision-21";
const FEATURED = [
  "ronald-acuna-miami-2021",
  "zverev-roland-garros-2022",
  "carolina-marin-indonesia-2019",
  "chris-bassitt-2021-face",
  "antoine-dupont-world-cup-2023",
  "lindsey-vonn-schladming-2013",
  "kobe-bryant-2013-achilles",
  "mohamed-salah-final-2018",
  "dominic-thiem-2021-wrist",
  "anthony-richardson-2023-shoulder",
];

test("all 193 observation pages expose general guidance, text highlights, related videos, and category routes", async ({
  request,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Observation routes belong to the public launch");
  const home = await (await request.get("/")).text();
  const observationPaths = [
    ...new Set(
      [...home.matchAll(/href="(\/videos\/[a-z0-9-]+\/)"/gu)].map(
        (match) => match[1]!,
      ),
    ),
  ];
  expect(observationPaths).toHaveLength(193);
  const categoryRoutes = new Set<string>();

  for (const path of observationPaths) {
    const slug = path.split("/").at(-2)!;
    const response = await request.get(path);
    expect(response.status(), slug).toBe(200);
    const html = await response.text();
    expect(html, slug).toContain("data-video-text-highlights");
    expect(html, slug).toContain("data-general-guidance");
    expect(html, slug).toContain("一般人參考：當下怎麼做");
    expect(html, slug).toContain("關鍵片段");
    expect(html, slug).toContain("字幕狀態");
    expect(html, slug).toContain("不是完整逐字稿");
    expect(html, slug).toContain("data-related-observations");

    const related = [...html.matchAll(/data-related-slug="([^"]+)"/gu)].map(
      (match) => match[1],
    );
    expect(related.length, slug).toBeGreaterThan(0);
    expect(related.length, slug).toBeLessThanOrEqual(3);
    expect(related, slug).not.toContain(slug);

    const routes = [
      ...html.matchAll(
        /href="(\/(?:body-parts|sports|situations)\/[a-z0-9-]+\/)"/gu,
      ),
    ].map((match) => match[1]!);
    expect(new Set(routes).size, slug).toBeGreaterThanOrEqual(3);
    for (const route of routes) categoryRoutes.add(route);
  }

  for (const route of categoryRoutes) {
    expect((await request.get(route)).status(), route).toBe(200);
  }
});

test("the ten featured observations identify their reviewed main-site resources", async ({
  page,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Observation routes belong to the public launch");
  for (const slug of FEATURED) {
    await page.goto(`/videos/${slug}/`);
    await expect(
      page.locator('[data-featured-observation="true"]'),
    ).toBeVisible();
    const resources = page.locator("[data-main-site-resources] a");
    expect(await resources.count(), slug).toBeGreaterThanOrEqual(1);
    expect(await resources.count(), slug).toBeLessThanOrEqual(3);
    for (let index = 0; index < (await resources.count()); index += 1) {
      await expect(resources.nth(index)).toHaveAttribute("target", "_blank");
      await expect(resources.nth(index)).toHaveAttribute(
        "rel",
        "noopener noreferrer",
      );
    }
  }
  await expectNoAxeViolations(page);
});

test("news, aftermath, and injury footage have consistent card and detail labels", async ({
  page,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Observation routes belong to the public launch");
  const examples = [
    {
      slug: "kane-williamson-2023-world-cup-thumb",
      category: "cricket",
      kind: "news-analysis",
      label: "傷勢新聞與說明",
    },
    {
      slug: "marketa-vondrousova-2024-berlin-hip",
      category: "tennis",
      kind: "aftermath",
      label: "受傷後處理與續賽",
    },
    {
      slug: "hubert-hurkacz-2024-wimbledon-knee",
      category: "tennis",
      kind: "injury-motion",
      label: "受傷動作觀察",
    },
    {
      slug: "shohei-ohtani-world-series-2024",
      category: "baseball",
      kind: "unknown",
      label: "傷害相關影片",
    },
  ];
  for (const example of examples) {
    for (const path of ["/", `/sports/${example.category}/`]) {
      await page.goto(path);
      const card = page.locator(`[data-observation-card="${example.slug}"]`);
      await expect(card.locator("[data-observation-footage-kind]")).toHaveText(
        `${example.label} →`,
      );
      await expect(
        card.locator("[data-observation-footage-kind]"),
      ).toHaveAttribute("data-observation-footage-kind", example.kind);
    }
    await page.goto(`/videos/${example.slug}/`);
    await expect(page.locator("[data-footage-kind]")).toHaveAttribute(
      "data-footage-kind",
      example.kind,
    );
    await expect(page.locator("[data-footage-kind]")).toContainText(
      example.label,
    );
  }
});

test("sharing metadata, favicons, and home heading hierarchy are complete", async ({
  page,
  request,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Public metadata belongs to the public launch");
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "運動傷害影片圖鑑｜看懂受傷，了解回場",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /當下怎麼做/u,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://injury.sportsmedicine.tw/",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\/injury\.sportsmedicine\.tw\//u,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const iconLinks = page.locator('link[rel="icon"]');
  await expect(iconLinks).toHaveCount(2);
  await expect(iconLinks.nth(0)).toHaveAttribute("href", "/favicon.ico");
  await expect(iconLinks.nth(0)).toHaveAttribute("sizes", "16x16 32x32");
  await expect(iconLinks.nth(1)).toHaveAttribute("href", "/favicon.svg");
  await expect(page.locator("h1")).toHaveCount(1);
  expect(
    await page.locator("#video-list-heading").evaluate((node) => node.tagName),
  ).toBe("H2");
  await expect(page.locator(".observation-card h3").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "直接看全部影片" }),
  ).toHaveAttribute("href", "#videos-heading");

  const svg = await request.get("/favicon.svg");
  expect(svg.status()).toBe(200);
  expect(svg.headers()["content-type"]).toContain("image/svg+xml");
  const ico = await request.get("/favicon.ico");
  expect(ico.status()).toBe(200);
  // Astro preview uses x-icon; Cloudflare serves IANA's registered ICO type.
  expect(ico.headers()["content-type"]).toMatch(
    /^image\/(?:x-icon|vnd\.microsoft\.icon)(?:;|$)/u,
  );
  const icoBody = await ico.body();
  expect(icoBody.readUInt16LE(0)).toBe(0);
  expect(icoBody.readUInt16LE(2)).toBe(1);
  expect(icoBody.readUInt16LE(4)).toBe(2);
  const entries = [0, 1].map((index) => {
    const directoryOffset = 6 + index * 16;
    const width = icoBody[directoryOffset] || 256;
    const height = icoBody[directoryOffset + 1] || 256;
    const byteLength = icoBody.readUInt32LE(directoryOffset + 8);
    const imageOffset = icoBody.readUInt32LE(directoryOffset + 12);
    return {
      width,
      height,
      planes: icoBody.readUInt16LE(directoryOffset + 4),
      bitCount: icoBody.readUInt16LE(directoryOffset + 6),
      byteLength,
      imageOffset,
      dibWidth: icoBody.readInt32LE(imageOffset + 4),
      dibHeight: icoBody.readInt32LE(imageOffset + 8) / 2,
    };
  });
  expect(entries).toEqual([
    expect.objectContaining({
      width: 16,
      height: 16,
      planes: 1,
      bitCount: 32,
      dibWidth: 16,
      dibHeight: 16,
    }),
    expect.objectContaining({
      width: 32,
      height: 32,
      planes: 1,
      bitCount: 32,
      dibWidth: 32,
      dibHeight: 32,
    }),
  ]);
  for (const entry of entries) {
    expect(entry.byteLength).toBeGreaterThan(40);
    expect(entry.imageOffset + entry.byteLength).toBeLessThanOrEqual(
      icoBody.length,
    );
  }

  expect(
    await (await request.get("/videos/ronald-acuna-miami-2021/")).text(),
  ).not.toContain("VideoObject");
  await expectNoAxeViolations(page);
});

test("review output stays noindex and does not publish a sitemap", async ({
  page,
  request,
}) => {
  test.skip(PUBLIC_LAUNCH, "This assertion targets the review artifact");
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,nofollow,noarchive,nosnippet,noimageindex",
  );
  expect(await (await request.get("/robots.txt")).text()).toBe(
    "User-agent: *\nDisallow: /\n",
  );
  expect((await request.get("/sitemap.xml")).status()).toBe(404);
});

test("curated collection shows ten ordered videos and restores all 200", async ({
  page,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Curated collection belongs to the public launch");
  await page.goto("/");
  const cards = page.locator("[data-discovery-slug]:visible");
  await expect(cards).toHaveCount(200);
  await page.getByRole("button", { name: "精選影片", exact: true }).click();
  await expect(cards).toHaveCount(10);
  await expect(page.locator("[data-discovery-status]")).toContainText(
    "精選 10 支",
  );
  expect(
    await cards.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-curated-rank")),
    ),
  ).toEqual(Array.from({ length: 10 }, (_, index) => String(index + 1)));
  expect(
    await cards.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-discovery-slug")),
    ),
  ).toEqual([...FEATURED]);
  await expect(
    page.locator('[data-discovery-slug="kobe-bryant-2013-achilles"] h3 a'),
  ).toHaveAttribute("href", "/videos/kobe-bryant-2013-achilles/");
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  // Inspect the collection at its intended anchor, away from partially
  // clipped category links beneath the sticky header after an auto-scroll.
  await page
    .locator("[data-video-discovery]")
    .evaluate((node) =>
      node.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "全部影片", exact: true }).click();
  await expect(cards).toHaveCount(200);
  await page.getByRole("button", { name: "精選影片", exact: true }).click();
  await expect(cards).toHaveCount(10);
});
