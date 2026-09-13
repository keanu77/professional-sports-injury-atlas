/**
 * Layout accessibility spec for the sportsmedicine.tw-aligned design system.
 * Covers Axe WCAG A/AA scans in both themes, the skip link and single main
 * landmark, visible keyboard focus, 44x44 control targets, persisted manual
 * theme, the 0.875-1.5 font-scale range, 200% zoom reflow without horizontal
 * main-content scrolling, reduced motion, and the mobile navigation
 * disclosure (aria-expanded, Escape close with focus return, focus trap).
 */

import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe("layout accessibility", () => {
  test("defaults to dark and passes Axe WCAG A/AA scans in both themes", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "深色模式" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expectNoAxeViolations(page);
  });

  test("exposes a skip link that jumps to the single main landmark", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("main")).toHaveId("main-content");

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toHaveAttribute("href", "#main-content");

    const hiddenBox = await skipLink.boundingBox();
    expect(hiddenBox).not.toBeNull();
    expect(hiddenBox!.y + hiddenBox!.height).toBeLessThanOrEqual(0);

    await skipLink.focus();
    const focusedBox = await skipLink.boundingBox();
    expect(focusedBox).not.toBeNull();
    expect(focusedBox!.y).toBeGreaterThanOrEqual(0);

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("keeps keyboard focus visible on interactive controls", async ({
    page,
    browserName,
  }) => {
    await page.goto("/");
    const themeToggle = page.getByRole("button", { name: "深色模式" });

    // WebKit only tabs through links/buttons with Option held down.
    const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
    let reachedControl = false;
    for (let tabPress = 0; tabPress < 15; tabPress += 1) {
      await page.keyboard.press(tabKey);
      if (await themeToggle.evaluate((el) => el === document.activeElement)) {
        reachedControl = true;
        break;
      }
    }
    expect(reachedControl).toBe(true);

    const outline = await themeToggle.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).not.toBe("none");
    expect(Number.parseFloat(outline.width)).toBeGreaterThan(0);
  });

  test("gives every persistent control a 44x44 minimum target", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");
    const controls = [
      page.getByRole("button", { name: "主選單" }),
      page.getByRole("button", { name: "深色模式" }),
      page.getByRole("button", { name: "縮小字級" }),
      page.getByRole("button", { name: "放大字級" }),
    ];
    for (const control of controls) {
      await expect(control).toBeVisible();
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("persists the manual theme choice locally only", async ({ page }) => {
    await page.goto("/");
    const themeToggle = page.getByRole("button", { name: "深色模式" });
    await expect(themeToggle).toHaveAttribute("aria-pressed", "true");

    await themeToggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(themeToggle).toHaveAttribute("aria-pressed", "false");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(
      page.getByRole("button", { name: "深色模式" }),
    ).toHaveAttribute("aria-pressed", "false");

    const storage = await page.evaluate(() => ({
      theme: window.localStorage.getItem("atlas-theme"),
      cookies: document.cookie,
    }));
    expect(storage.theme).toBe("light");
    expect(storage.cookies).toBe("");

    await page.getByRole("button", { name: "深色模式" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("renders the six public follow links from the main site", async ({
    page,
  }) => {
    await page.goto("/");
    const follow = page.getByRole("navigation", { name: "追蹤吳易澄醫師" });
    const expected = [
      ["衛教部落格", "https://blog.sportsmedicine.tw/"],
      ["Facebook", "https://www.facebook.com/EthanWuMD/"],
      ["Instagram", "https://www.instagram.com/ethan77wu/"],
      ["GitHub", "https://github.com/keanu77"],
      ["LINE", "https://line.me/R/ti/p/@521cvffb"],
      ["個人網站", "https://sportsmedicine.tw/"],
    ] as const;
    await expect(follow.getByRole("link")).toHaveCount(expected.length);
    for (const [name, href] of expected) {
      const link = follow.getByRole("link", { name: new RegExp(`^${name}`) });
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  test("clamps and persists the font scale between 0.875 and 1.5", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-font-scale", "1");

    const increase = page.getByRole("button", { name: "放大字級" });
    for (let click = 0; click < 6; click += 1) await increase.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-font-scale",
      "1.5",
    );
    const enlarged = await page.evaluate(() =>
      Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      ),
    );
    expect(enlarged).toBeCloseTo(24, 0);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-font-scale",
      "1.5",
    );

    const decrease = page.getByRole("button", { name: "縮小字級" });
    for (let click = 0; click < 8; click += 1) await decrease.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-font-scale",
      "0.875",
    );
    const reduced = await page.evaluate(() =>
      Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      ),
    );
    expect(reduced).toBeCloseTo(14, 0);

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("atlas-font-scale"),
    );
    expect(stored).toBe("0.875");
  });

  test("avoids horizontal main-content scrolling at 200% zoom reflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto("/");
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
  });

  test("keeps all three redesigned templates stable across target breakpoints", async ({
    page,
  }) => {
    const targets = [
      { path: "/", hero: "video-grid" },
      { path: "/injuries/ankle-sprain/", hero: "band" },
      {
        path: "/cases/kevin-durant-achilles-rupture-2019/",
        hero: "case",
      },
    ] as const;

    for (const width of [320, 768, 1280, 1536]) {
      await page.setViewportSize({ width, height: 900 });
      for (const target of targets) {
        const response = await page.goto(target.path);
        expect([200, 304], target.path).toContain(response?.status());
        const geometry = await page.evaluate(() => {
          const root = document.documentElement;
          const main = document.querySelector("main");
          return {
            documentOverflow: root.scrollWidth - root.clientWidth,
            mainOverflow:
              main === null ? Number.NaN : main.scrollWidth - main.clientWidth,
          };
        });
        expect(
          geometry.documentOverflow,
          `${width}px ${target.path}`,
        ).toBeLessThanOrEqual(1);
        // The home hero is intentionally full-bleed beyond the 72rem main
        // column on wide screens; the document itself must still never scroll.
        if (!(target.path === "/" && width > 1152)) {
          expect(
            geometry.mainOverflow,
            `${width}px ${target.path}`,
          ).toBeLessThanOrEqual(1);
        }

        if (target.hero === "band") {
          const picture = page.locator(".editorial-band-picture");
          const copy = page.locator(".editorial-band-copy");
          const stage = page.locator(".editorial-band-stage");
          await expect(picture).toBeVisible();
          await expect(copy).toBeVisible();
          const [pictureBox, copyBox, stageBox] = await Promise.all([
            picture.boundingBox(),
            copy.boundingBox(),
            stage.boundingBox(),
          ]);
          expect(pictureBox).not.toBeNull();
          expect(copyBox).not.toBeNull();
          expect(stageBox).not.toBeNull();
          if (width < 768) {
            expect(pictureBox!.y + pictureBox!.height).toBeLessThanOrEqual(
              copyBox!.y + 1,
            );
            await expect(page.locator(".editorial-band-scrim")).toHaveCSS(
              "display",
              "none",
            );
          } else {
            expect(copyBox!.y).toBeGreaterThanOrEqual(stageBox!.y);
            expect(copyBox!.y + copyBox!.height).toBeLessThanOrEqual(
              stageBox!.y + stageBox!.height + 1,
            );
          }
        } else if (target.hero === "case") {
          const titleBox = await page.locator("h1").boundingBox();
          const figureBox = await page.locator(".case-video").boundingBox();
          expect(titleBox).not.toBeNull();
          expect(figureBox).not.toBeNull();
          expect(figureBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height);
          expect(figureBox!.width).toBeLessThanOrEqual(width);
        }
      }
    }
  });

  test("honors prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const smooth = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(smooth).toBe("smooth");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const reduced = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(reduced).toBe("auto");
  });

  test("mobile navigation announces state, traps focus, and closes on Escape", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "主選單" });
    const panel = page.locator("#site-nav-panel");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-controls", "site-nav-panel");
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    await expect(page.getByRole("link", { name: "首頁" })).toBeFocused();
    await expectNoAxeViolations(page);

    for (let tabPress = 0; tabPress < 4; tabPress += 1) {
      await page.keyboard.press("Tab");
      const inTrap = await page.evaluate(() => {
        const active = document.activeElement;
        if (active === null) return false;
        const panelEl = document.querySelector("#site-nav-panel");
        const toggleEl = document.querySelector("[data-nav-toggle]");
        return (
          active === toggleEl || (panelEl !== null && panelEl.contains(active))
        );
      });
      expect(inTrap).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});
