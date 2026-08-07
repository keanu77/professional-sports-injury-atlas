/**
 * WCAG AA contrast tests over the design tokens. The tests parse the raw hex
 * tokens out of `src/styles/tokens.css` and require at least 4.5:1 for every
 * declared normal-text pair and at least 3:1 for large-text/non-text
 * boundaries, in both the light and manual dark palettes. White text on
 * `--brand-500` is below 4.5:1 and therefore forbidden: the semantic action
 * tokens must map to `--brand-action` (light) and `--dark-action` (dark),
 * and no stylesheet may use `--brand-500` as a fill behind text.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesDir = new URL("../../src/styles/", import.meta.url);
const tokensCss = readFileSync(new URL("tokens.css", stylesDir), "utf8");
const otherSheets = ["global.css", "layout.css", "components.css"].map(
  (name) => ({
    name,
    css: readFileSync(new URL(name, stylesDir), "utf8"),
  }),
);

/** Exact brand palette required by the plan. */
const EXPECTED_TOKENS: Record<string, string> = {
  "brand-500": "#1cb3cc",
  "brand-deep": "#148da1",
  "brand-action": "#3a5f66",
  "brand-soft": "#d4f6ff",
  "accent-500": "#66bbdd",
  "ink-strong": "#222222",
  "ink-muted": "#535353",
  "surface-page": "#ffffff",
  "surface-info": "#f6f6f6",
  "surface-muted": "#eeeeee",
  "accent-ink": "#222222",
  "dark-page": "#10262b",
  "dark-surface": "#183940",
  "dark-ink": "#f6f6f6",
  "dark-action": "#d4f6ff",
  "dark-accent": "#66bbdd",
};

function parseHexTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(
    /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g,
  )) {
    const name = match[1];
    const value = match[2];
    if (!tokens.has(name)) tokens.set(name, value.toLowerCase());
  }
  return tokens;
}

const tokens = parseHexTokens(tokensCss);

function hexToken(name: string): string {
  if (name.startsWith("#")) return name;
  const value = tokens.get(name);
  if (value === undefined) {
    throw new Error(`token --${name} is not defined as a hex value`);
  }
  return value;
}

function channelToLinear(channel: number): number {
  const scaled = channel / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return (
    0.2126 * channelToLinear(red) +
    0.7152 * channelToLinear(green) +
    0.0722 * channelToLinear(blue)
  );
}

function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(hexToken(foreground));
  const second = relativeLuminance(hexToken(background));
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Every normal-text foreground/background pair used by the layout. */
const NORMAL_TEXT_PAIRS: Array<[string, string]> = [
  ["ink-strong", "surface-page"],
  ["ink-strong", "surface-info"],
  ["ink-muted", "surface-page"],
  ["ink-muted", "surface-info"],
  ["brand-action", "surface-page"],
  ["brand-action", "surface-info"],
  ["#ffffff", "brand-action"],
  ["accent-ink", "accent-500"],
  ["dark-ink", "dark-page"],
  ["dark-ink", "dark-surface"],
  ["dark-action", "dark-page"],
  ["dark-action", "dark-surface"],
  ["ink-strong", "dark-action"],
  ["accent-ink", "dark-accent"],
  ["accent-ink", "brand-soft"],
];

/** Large-text and non-text (border/focus) boundaries. */
const LARGE_AND_NON_TEXT_PAIRS: Array<[string, string]> = [
  ["brand-deep", "surface-page"],
  ["brand-deep", "surface-info"],
  ["brand-action", "surface-page"],
  ["brand-action", "surface-info"],
  ["dark-action", "dark-page"],
  ["dark-action", "dark-surface"],
];

describe("design token palette", () => {
  it("defines the exact brand tokens from the plan", () => {
    for (const [name, value] of Object.entries(EXPECTED_TOKENS)) {
      expect(tokens.get(name), `--${name}`).toBe(value);
    }
  });

  for (const [foreground, background] of NORMAL_TEXT_PAIRS) {
    it(`keeps normal text ${foreground} on ${background} at >= 4.5:1`, () => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const [foreground, background] of LARGE_AND_NON_TEXT_PAIRS) {
    it(`keeps large-text/non-text ${foreground} on ${background} at >= 3:1`, () => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe("case cover red lines", () => {
  const component = readFileSync(
    new URL("../../src/components/cases/CaseCover.astro", import.meta.url),
    "utf8",
  );
  const caseRoute = readFileSync(
    new URL("../../src/pages/cases/[slug].astro", import.meta.url),
    "utf8",
  );

  it("renders one original inline SVG cover on every case route", () => {
    expect(caseRoute).toMatch(/<CaseCover\s/);
    expect(component).toMatch(/<svg[\s\S]*role="img"/);
    for (const injury of ["acl", "ankle-sprain", "achilles-rupture"]) {
      expect(component).toContain(`data-cover-illustration="${injury}"`);
    }
  });

  it("contains no image, game-frame, thumbnail, or portrait dependency", () => {
    expect(component).not.toMatch(/<image\b|<img\b|https?:\/\//i);
    expect(component).toContain("非診斷影像 · 非特定球員身體");
  });
});

describe("forbidden white-on-brand-500 pairing", () => {
  it("documents that white on --brand-500 fails WCAG AA for normal text", () => {
    expect(contrastRatio("#ffffff", "brand-500")).toBeLessThan(4.5);
  });

  it("maps the semantic action tokens to the accessible action colors", () => {
    expect(tokensCss).toMatch(/--color-action:\s*var\(--brand-action\);/);
    expect(tokensCss).toMatch(/--color-action:\s*var\(--dark-action\);/);
    expect(tokensCss).not.toMatch(/--color-action:\s*var\(--brand-500\);/);
  });

  it("never uses --brand-500 as a fill behind text in any stylesheet", () => {
    for (const sheet of [
      { name: "tokens.css", css: tokensCss },
      ...otherSheets,
    ]) {
      expect(
        /background[^;]*var\(--brand-500\)/.test(sheet.css),
        `${sheet.name} must not use --brand-500 as a background fill`,
      ).toBe(false);
    }
  });
});
