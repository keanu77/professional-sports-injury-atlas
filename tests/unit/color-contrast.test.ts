/**
 * WCAG AA guardrails for the production sportsmedicine.tw OKLCH system. The
 * source tokens are asserted as exact light-dark() pairs, then converted from
 * OKLCH to linear sRGB so every text/background and focus/boundary pairing is
 * checked in both explicit themes. Decorative SVG accent/metric shapes do not
 * carry information; all SVG text uses the high-contrast ink token.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface OklchColor {
  lightness: number;
  chroma: number;
  hue: number;
}

type ThemePair = readonly [OklchColor, OklchColor];
type ThemeIndex = 0 | 1;

const tokensCss = readFileSync(
  new URL("../../src/styles/tokens.css", import.meta.url),
  "utf8",
);

describe("editorial typography assets", () => {
  const globalCss = readFileSync(
    new URL("../../src/styles/global.css", import.meta.url),
    "utf8",
  );
  const fontNames = [
    "noto-serif-tc-600.woff2",
    "noto-serif-tc-700.woff2",
    "noto-serif-tc-heading-600.woff2",
    "noto-serif-tc-heading-700.woff2",
  ];

  it("self-hosts valid sub-250KB WOFF2 files with swap rendering", () => {
    for (const name of fontNames) {
      const url = new URL(`../../public/fonts/${name}`, import.meta.url);
      expect(statSync(url).size, name).toBeLessThan(250_000);
      expect(readFileSync(url).subarray(0, 4).toString("ascii"), name).toBe(
        "wOF2",
      );
      expect(globalCss).toContain(`/fonts/${name}`);
    }
    expect(globalCss.match(/font-display:\s*swap/g)).toHaveLength(4);
  });
});

function walkUiStyleSources(directory: URL): URL[] {
  const files: URL[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const url = new URL(
      entry.isDirectory() ? `${entry.name}/` : entry.name,
      directory,
    );
    if (entry.isDirectory()) {
      files.push(...walkUiStyleSources(url));
    } else if (/\.(astro|css)$/.test(entry.name)) {
      files.push(url);
    }
  }
  return files;
}

const expectedTokens: Record<string, ThemePair> = {
  "color-brand-primary": [
    { lightness: 0.53, chroma: 0.12, hue: 228 },
    { lightness: 0.66, chroma: 0.13, hue: 228 },
  ],
  "color-brand-primary-hover": [
    { lightness: 0.46, chroma: 0.11, hue: 228 },
    { lightness: 0.74, chroma: 0.12, hue: 228 },
  ],
  "color-brand-accent": [
    { lightness: 0.7, chroma: 0.15, hue: 45 },
    { lightness: 0.72, chroma: 0.16, hue: 45 },
  ],
  "color-brand-accent-hover": [
    { lightness: 0.6, chroma: 0.14, hue: 45 },
    { lightness: 0.66, chroma: 0.15, hue: 45 },
  ],
  "color-metric": [
    { lightness: 0.8, chroma: 0.16, hue: 80 },
    { lightness: 0.82, chroma: 0.16, hue: 80 },
  ],
  "color-surface": [
    { lightness: 0.988, chroma: 0.003, hue: 220 },
    { lightness: 0.19, chroma: 0.013, hue: 240 },
  ],
  "color-surface-muted": [
    { lightness: 0.97, chroma: 0.006, hue: 220 },
    { lightness: 0.23, chroma: 0.015, hue: 240 },
  ],
  "color-surface-raised": [
    { lightness: 1, chroma: 0, hue: 0 },
    { lightness: 0.25, chroma: 0.017, hue: 240 },
  ],
  "color-ink": [
    { lightness: 0.18, chroma: 0.02, hue: 240 },
    { lightness: 0.92, chroma: 0.013, hue: 240 },
  ],
  "color-ink-muted": [
    { lightness: 0.42, chroma: 0.015, hue: 240 },
    { lightness: 0.7, chroma: 0.012, hue: 240 },
  ],
  "color-warning": [
    { lightness: 0.47, chroma: 0.12, hue: 75 },
    { lightness: 0.85, chroma: 0.12, hue: 85 },
  ],
  "color-warning-surface": [
    { lightness: 0.97, chroma: 0.04, hue: 85 },
    { lightness: 0.3, chroma: 0.05, hue: 85 },
  ],
  "color-warning-border": [
    { lightness: 0.88, chroma: 0.08, hue: 85 },
    { lightness: 0.45, chroma: 0.08, hue: 85 },
  ],
  "color-danger": [
    { lightness: 0.51, chroma: 0.2, hue: 27 },
    { lightness: 0.78, chroma: 0.15, hue: 25 },
  ],
  "color-danger-surface": [
    { lightness: 0.96, chroma: 0.03, hue: 25 },
    { lightness: 0.27, chroma: 0.06, hue: 25 },
  ],
  "color-danger-border": [
    { lightness: 0.7, chroma: 0.17, hue: 25 },
    { lightness: 0.55, chroma: 0.13, hue: 25 },
  ],
  hairline: [
    { lightness: 0.9, chroma: 0.005, hue: 220 },
    { lightness: 0.32, chroma: 0.015, hue: 240 },
  ],
  "hairline-strong": [
    { lightness: 0.8, chroma: 0.008, hue: 220 },
    { lightness: 0.4, chroma: 0.015, hue: 240 },
  ],
};

function parseLightDarkTokens(css: string): Map<string, ThemePair> {
  const tokens = new Map<string, ThemePair>();
  const expression =
    /--([a-z0-9-]+):\s*light-dark\(\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)\s*,\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)\s*\)\s*;/g;
  for (const match of css.matchAll(expression)) {
    tokens.set(match[1]!, [
      {
        lightness: Number(match[2]) / 100,
        chroma: Number(match[3]),
        hue: Number(match[4]),
      },
      {
        lightness: Number(match[5]) / 100,
        chroma: Number(match[6]),
        hue: Number(match[7]),
      },
    ]);
  }
  return tokens;
}

const tokens = parseLightDarkTokens(tokensCss);

function token(name: string, theme: ThemeIndex): OklchColor {
  const pair = tokens.get(name);
  if (pair === undefined) throw new Error(`missing OKLCH token --${name}`);
  return pair[theme];
}

function linearSrgb(color: OklchColor): [number, number, number] {
  const hueRadians = (color.hue * Math.PI) / 180;
  const a = color.chroma * Math.cos(hueRadians);
  const b = color.chroma * Math.sin(hueRadians);
  const l = (color.lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (color.lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (color.lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function relativeLuminance(color: OklchColor): number {
  const [red, green, blue] = linearSrgb(color).map((channel) =>
    Math.min(1, Math.max(0, channel)),
  );
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function contrastRatio(first: OklchColor, second: OklchColor): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const normalTextPairs: Array<readonly [string, string]> = [
  ["color-ink", "color-surface"],
  ["color-ink", "color-surface-muted"],
  ["color-ink", "color-surface-raised"],
  ["color-ink-muted", "color-surface"],
  ["color-ink-muted", "color-surface-raised"],
  ["color-brand-primary", "color-surface"],
  ["color-brand-primary", "color-surface-muted"],
  ["color-brand-primary", "color-surface-raised"],
  ["color-surface-raised", "color-brand-primary"],
  ["color-surface-raised", "color-brand-primary-hover"],
  ["color-warning", "color-warning-surface"],
  ["color-danger", "color-danger-surface"],
];

const nonTextPairs: Array<readonly [string, string]> = [
  ["color-brand-primary", "color-surface"],
  ["color-brand-primary", "color-surface-raised"],
  ["color-brand-primary-hover", "color-surface"],
  ["color-brand-primary-hover", "color-surface-raised"],
  ["color-brand-accent-hover", "color-surface-raised"],
];

describe("sportsmedicine.tw design token palette", () => {
  it("defines every production light-dark OKLCH pair exactly", () => {
    expect(Object.fromEntries(tokens)).toEqual(expectedTokens);
    expect(tokensCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("ties light-dark() selection to the existing explicit theme", () => {
    expect(tokensCss).toMatch(/:root\s*{[\s\S]*color-scheme:\s*light;/);
    expect(tokensCss).toMatch(
      /:root\[data-theme="dark"\]\s*{\s*color-scheme:\s*dark;/,
    );
  });

  it("defines accessible foreground aliases for brand fills", () => {
    const compact = tokensCss.replace(/\s+/g, "");
    expect(compact).toContain("--color-on-brand:var(--color-surface-raised);");
    expect(compact).toContain(
      "--color-on-warm:light-dark(var(--color-ink),var(--color-surface));",
    );
  });

  for (const theme of [0, 1] as const) {
    const themeLabel = theme === 0 ? "light" : "dark";
    for (const [foreground, background] of normalTextPairs) {
      it(`${themeLabel}: ${foreground} on ${background} is >= 4.5:1`, () => {
        expect(
          contrastRatio(token(foreground, theme), token(background, theme)),
        ).toBeGreaterThanOrEqual(4.5);
      });
    }

    it(`${themeLabel}: the warm accent has a >= 4.5:1 foreground`, () => {
      const foreground = token(
        theme === 0 ? "color-ink" : "color-surface",
        theme,
      );
      expect(
        contrastRatio(foreground, token("color-brand-accent", theme)),
      ).toBeGreaterThanOrEqual(4.5);
    });

    for (const [foreground, background] of nonTextPairs) {
      it(`${themeLabel}: ${foreground} boundary on ${background} is >= 3:1`, () => {
        expect(
          contrastRatio(token(foreground, theme), token(background, theme)),
        ).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

describe("whole-site palette migration", () => {
  const tokenUrl = new URL("../../src/styles/tokens.css", import.meta.url);
  const uiFiles = walkUiStyleSources(new URL("../../src/", import.meta.url));
  const legacySemanticToken =
    /--color-(page|text|muted|action|on-action|accent|on-accent|border|focus)\b/;
  const rawColorLiteral = /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|lab|lch|oklch)\(/i;

  it("uses no legacy semantic aliases or raw colors outside tokens.css", () => {
    for (const url of uiFiles) {
      if (url.href === tokenUrl.href) continue;
      const source = readFileSync(url, "utf8");
      expect(source, url.pathname).not.toMatch(legacySemanticToken);
      expect(source, url.pathname).not.toMatch(rawColorLiteral);
    }
  });
});

describe("governed case cover", () => {
  const component = readFileSync(
    new URL("../../src/components/cases/CaseCover.astro", import.meta.url),
    "utf8",
  );
  const videoComponent = readFileSync(
    new URL("../../src/components/cases/CaseVideo.astro", import.meta.url),
    "utf8",
  );
  const caseRoute = readFileSync(
    new URL("../../src/pages/cases/[slug].astro", import.meta.url),
    "utf8",
  );

  it("routes every case cover through the video facade", () => {
    expect(caseRoute).toMatch(/<CaseVideo\s/);
    expect(caseRoute).not.toMatch(/<CaseCover\s/);
    expect(videoComponent).toContain(
      'import CaseCover from "./CaseCover.astro"',
    );
    expect(videoComponent).toMatch(/<CaseCover\s/);
    expect(component).toMatch(/<Picture\s/);
    expect(component).toMatch(/<Image\s/);
    expect(component).toContain("data-local-original-svg");
    expect(component).toContain("data-cover-illustration={injuryCode}");
    expect(component).not.toMatch(/<svg\b/i);
  });

  it("uses the local Astro image pipeline without vector drawing primitives", () => {
    expect(component).toContain(
      'import { Image, Picture } from "astro:assets"',
    );
    expect(component).toContain(
      "caseImageFor(injuryCode, recordId, athleteName)",
    );
    expect(component).toContain('formats={["avif", "webp"]}');
    expect(component).toMatch(
      /fallbackFormat=\{selection\.image\.format === "png" \? "png" : "jpg"\}/u,
    );
    expect(component).toContain("src={selection.image}");
    expect(component).toContain("widths={renditionWidths}");
    expect(component).not.toContain("image-set(");
    expect(component).not.toMatch(
      /<(?:path|rect|text|circle|ellipse|line|polyline|polygon)\b/i,
    );
  });

  it("renders one bucket-independent notice block without licensing the host page", () => {
    expect(component.match(/data-attribution-notices/g) ?? []).toHaveLength(1);
    expect(
      component.match(/rightsAttribution\.copyrightNotice\.status/g) ?? [],
    ).toHaveLength(1);
    expect(
      component.match(/rightsAttribution\.disclaimerNotice\.status/g) ?? [],
    ).toHaveLength(1);
    expect(
      component.match(/rightsAttribution\.otherPerFileNotice\.status/g) ?? [],
    ).toHaveLength(1);
    expect(component).not.toContain('rel="license');
  });

  it("binds every cover to stable responsive case-photo renditions", () => {
    expect(component).toContain("recordId = idPrefix");
    expect(component).toContain("data-cover-variant={selection.variant");
    expect(component).toContain("caseThumbWidthsFor(selection.image.width)");
    expect(component).toContain("caseHeroWidthsFor(selection.image.width)");
    expect(component).toContain('loading={isHero ? "eager" : "lazy"}');
    expect(component).toContain(
      "object-position: var(--cover-focal-x) var(--cover-focal-y)",
    );
  });

  it("contains no authored image tag, inline SVG, game frame, remote thumbnail, or portrait dependency", () => {
    expect(component).not.toMatch(/<image\b|<img\b|https?:\/\//);
    expect(component).toContain("匿名運動員面孔不可見");
    expect(component).toContain("不代表任何特定球員或真實受傷事件");
    expect(component).toContain("selection.nonEventCaption");
    expect(component).toContain("data-original-svg-label");
    expect(component).toContain("Wikimedia Commons 永久說明頁");
  });
});
