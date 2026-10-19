// Run from the repository root: node docs/launch/tools/capture-demo.mjs
// Captures the public website without playing third-party videos or posting analytics.
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const work = resolve("output/repo-launch-20261020/media");
const media = resolve("docs/media");
await mkdir(work, { recursive: true });
await mkdir(media, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  colorScheme: "light",
  recordVideo: { dir: work, size: { width: 1280, height: 720 } },
});
await context.route("**/*", async (route) => {
  if (route.request().method() === "POST") return route.abort();
  return route.continue();
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const card = (
  heading,
  subtitle,
  footer,
) => `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:1280px;height:720px;background:#102b34;color:#f3f6f5;font-family:Inter,"PingFang TC",sans-serif;padding:100px 108px}
.eyebrow{font-size:20px;letter-spacing:5px;color:#9ad8d1}h1{font-size:64px;line-height:1.3;font-weight:650;margin:40px 0 30px;letter-spacing:2px}p{font-size:28px;line-height:1.8;color:#c3d8dc}footer{position:absolute;bottom:65px;font-size:20px;color:#9ad8d1}.rule{width:80px;height:5px;background:#e4c18b;margin-top:24px}</style>
<div class="eyebrow">SPORTS INJURY VIDEO ATLAS</div><h1>${heading}</h1><div class="rule"></div><p>${subtitle}</p><footer>${footer}</footer>`;
await page.setContent(
  card(
    "從選手名稱，找到事件來源",
    "實際操作：搜尋 Acuna → 開啟事件 → 查看來源",
    "injury.sportsmedicine.tw",
  ),
);
await page.waitForTimeout(2500);
await page.goto("https://injury.sportsmedicine.tw/", {
  waitUntil: "networkidle",
});
await page
  .locator('[data-video-discovery][data-discovery-ready="true"]')
  .waitFor();
await page.screenshot({ path: `${work}/homepage.png` });
await page.waitForTimeout(1800);
const showCatalog = async () =>
  page.locator("[data-video-discovery]").evaluate((element) => {
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 108,
      behavior: "smooth",
    });
  });
await showCatalog();
await page.waitForTimeout(700);
await page.getByRole("searchbox").pressSequentially("Acuna", { delay: 150 });
const result = page.locator(
  '[data-video-discovery] h3 a[href="/videos/ronald-acuna-miami-2021/"]',
);
await result.waitFor();
await page.waitForTimeout(700);
await page.screenshot({ path: `${work}/search.png` });
await page.waitForTimeout(2200);
await result.click();
await page.waitForURL("**/videos/ronald-acuna-miami-2021/**");
await page.locator("[data-detail-contents]").waitFor();
await page.waitForTimeout(1800);
await page
  .locator(
    '[data-detail-contents] a[href="#event-mechanism-ronald-acuna-miami-2021"]',
  )
  .click();
await page.waitForTimeout(1200);
await page
  .locator('a[href="#event-source-ronald-acuna-miami-2021-4"]')
  .first()
  .click();
await page.locator("#event-source-ronald-acuna-miami-2021-4").waitFor();
await page
  .locator("#event-source-ronald-acuna-miami-2021-1")
  .evaluate((element) => {
    element
      .closest("ol")
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
await page.waitForTimeout(2200);
await page.screenshot({ path: `${work}/sources.png` });
await page.locator("[data-catalog-return]").click();
await page.waitForURL("https://injury.sportsmedicine.tw/**");
await showCatalog();
if ((await page.getByRole("searchbox").inputValue()) !== "Acuna") {
  throw new Error("Catalog search state was not restored");
}
await page.waitForTimeout(1800);
await page.setContent(
  card(
    "查找影片，也回到來源",
    "教育索引 · 保留資訊來源與未知<br>自有程式碼採 MIT；內容與影音另有授權範圍",
    "injury.sportsmedicine.tw · github.com/keanu77/professional-sports-injury-atlas",
  ),
);
await page.waitForTimeout(3000);
const video = page.video();
await context.close();
const videoPath = await video.path();

const artwork = await browser.newPage({
  viewport: { width: 1280, height: 640 },
  deviceScaleFactor: 1,
});
const home = (await readFile(`${work}/homepage.png`)).toString("base64");
await artwork.setContent(`<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:1280px;height:640px;background:#102b34;color:#f2f6f5;font-family:Inter,"PingFang TC",sans-serif;overflow:hidden;padding:58px 60px}
.eyebrow{font-size:18px;letter-spacing:3px;color:#a2d5cf}h1{font-size:64px;line-height:1.25;margin:44px 0 25px;letter-spacing:2px;font-weight:650}.desc{font-size:23px;color:#c4d9dc;line-height:1.7}.stat{font-size:20px;color:#e4c18b;margin-top:29px}.browser{position:absolute;left:610px;top:137px;width:624px;border:1px solid #527079;border-radius:12px;overflow:hidden;box-shadow:0 25px 70px #0007;background:#fff;transform:rotate(-2deg)}.bar{height:35px;background:#e6edef;color:#54666c;font-size:13px;padding:9px 15px}.browser img{width:100%;display:block}.footer{position:absolute;bottom:40px;left:60px;font-size:20px;color:#aad8d2}.label{position:absolute;right:60px;bottom:40px;color:#a6bfc4;font-size:15px}
</style><div class="eyebrow">SPORTS MEDICINE · EDUCATION</div><h1>運動傷害<br>影片圖鑑</h1><div class="desc">搜尋選手與受傷部位<br>追查事件來源與回場脈絡</div><div class="stat">200 支影片 · 30 種運動 · 14 個部位</div><div class="browser"><div class="bar">injury.sportsmedicine.tw</div><img src="data:image/png;base64,${home}"></div><div class="footer">injury.sportsmedicine.tw</div><div class="label">Curated by Yi-Cheng Wu · 2026.10</div>`);
await artwork.screenshot({ path: `${media}/social-preview-1280x640.png` });
await browser.close();
await writeFile(
  `${work}/capture.json`,
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      source: "https://injury.sportsmedicine.tw/",
      videoPath,
      errors,
      searchRestored: true,
      originalVideoPlayback: false,
      telemetryPosted: false,
    },
    null,
    2,
  ),
);
if (errors.length) throw new Error(`Page errors: ${errors.join("; ")}`);
console.log(
  JSON.stringify({
    videoPath,
    socialPreview: `${media}/social-preview-1280x640.png`,
  }),
);
