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
  test("passes Axe WCAG A/AA scans in light and manual dark mode", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "深色模式" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
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
    await expect(themeToggle).toHaveAttribute("aria-pressed", "false");

    await themeToggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(themeToggle).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(
      page.getByRole("button", { name: "深色模式" }),
    ).toHaveAttribute("aria-pressed", "true");

    const storage = await page.evaluate(() => ({
      theme: window.localStorage.getItem("atlas-theme"),
      cookies: document.cookie,
    }));
    expect(storage.theme).toBe("dark");
    expect(storage.cookies).toBe("");

    await page.getByRole("button", { name: "深色模式" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
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
