/**
 * Client-side site chrome: manual theme toggle, font-scale controls, the
 * mobile navigation disclosure (aria-expanded, Escape close with focus
 * return, focus trap), and skip-link focus handoff. Preferences are stored
 * only in localStorage on the reader's device; nothing is transmitted.
 * BaseLayout applies the persisted values inline before first paint; this
 * module only wires the controls.
 */

export const THEME_STORAGE_KEY = "atlas-theme";
export const FONT_SCALE_STORAGE_KEY = "atlas-font-scale";
export const FONT_SCALE_STEPS = [0.875, 1, 1.125, 1.25, 1.5] as const;
export const MIN_FONT_SCALE = 0.875;
export const MAX_FONT_SCALE = 1.5;

type Theme = "light" | "dark";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Storage may be unavailable; the in-page state still applies. */
  }
}

/** Clamps any parsed value into the supported 0.875-1.5 range. */
export function clampFontScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, value));
}

function applyFontScale(scale: number): void {
  document.documentElement.style.setProperty("--font-scale", String(scale));
  document.documentElement.dataset.fontScale = String(scale);
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function initThemeToggle(root: Document): void {
  const button = root.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (button === null) return;
  const syncPressed = (): void => {
    button.setAttribute(
      "aria-pressed",
      currentTheme() === "dark" ? "true" : "false",
    );
  };
  syncPressed();
  button.addEventListener("click", () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    writeStorage(THEME_STORAGE_KEY, next);
    syncPressed();
  });
}

function initFontScaleControls(root: Document): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>("[data-font-step]");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const current = clampFontScale(
        Number.parseFloat(
          document.documentElement.dataset.fontScale ??
            readStorage(FONT_SCALE_STORAGE_KEY) ??
            "1",
        ),
      );
      let index = 0;
      for (let step = 0; step < FONT_SCALE_STEPS.length; step += 1) {
        if (
          Math.abs(FONT_SCALE_STEPS[step] - current) <
          Math.abs(FONT_SCALE_STEPS[index] - current)
        ) {
          index = step;
        }
      }
      const nextIndex =
        button.dataset.fontStep === "up"
          ? Math.min(FONT_SCALE_STEPS.length - 1, index + 1)
          : Math.max(0, index - 1);
      const next = FONT_SCALE_STEPS[nextIndex];
      applyFontScale(next);
      writeStorage(FONT_SCALE_STORAGE_KEY, String(next));
    });
  }
}

function initMobileNav(root: Document): void {
  const header = root.querySelector<HTMLElement>("[data-site-header]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const panel = root.querySelector<HTMLElement>("#site-nav-panel");
  if (header === null || toggle === null || panel === null) return;

  header.dataset.navEnhanced = "true";

  const trapItems = (): HTMLElement[] => [
    toggle,
    ...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
  ];

  const close = (returnFocus: boolean): void => {
    toggle.setAttribute("aria-expanded", "false");
    panel.dataset.open = "false";
    if (returnFocus) toggle.focus();
  };

  const open = (): void => {
    toggle.setAttribute("aria-expanded", "true");
    panel.dataset.open = "true";
    panel.querySelector<HTMLElement>("a[href], button")?.focus();
  };

  toggle.addEventListener("click", () => {
    if (toggle.getAttribute("aria-expanded") === "true") {
      close(false);
    } else {
      open();
    }
  });

  root.addEventListener("keydown", (event: KeyboardEvent) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (window.getComputedStyle(toggle).display === "none") return;
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key !== "Tab") return;
    /* Fully manage Tab while the panel is open so the trap behaves the same
       in every engine, including WebKit's default tab-skipping. */
    event.preventDefault();
    const items = trapItems();
    if (items.length === 0) return;
    const active =
      root.activeElement instanceof HTMLElement ? root.activeElement : null;
    const index = active === null ? -1 : items.indexOf(active);
    const nextIndex =
      index === -1
        ? 0
        : (index + (event.shiftKey ? -1 : 1) + items.length) % items.length;
    items[nextIndex]?.focus();
  });
}

function initSkipLink(root: Document): void {
  const skipLink = root.querySelector<HTMLAnchorElement>(".skip-link");
  const main = root.querySelector<HTMLElement>("#main-content");
  if (skipLink === null || main === null) return;
  skipLink.addEventListener("click", () => {
    main.focus();
  });
}

function initStickyHeader(root: Document): void {
  const header = root.querySelector<HTMLElement>(".site-header");
  const sentinel = root.querySelector<HTMLElement>("[data-header-sentinel]");
  if (
    header === null ||
    sentinel === null ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    header.classList.toggle("is-stuck", entry?.isIntersecting === false);
  });
  observer.observe(sentinel);
}

/** Wires theme, type scale, navigation, sticky chrome, and skip-link behavior. */
export function initSiteChrome(root: Document = document): void {
  initThemeToggle(root);
  initFontScaleControls(root);
  initMobileNav(root);
  initSkipLink(root);
  initStickyHeader(root);
}
