import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

describe("controlled early preferences and public CSP", () => {
  it("uses an external parser-blocking initializer before body parsing", () => {
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    const script = layout.match(
      /<script\b[^>]*src="\/preferences-init\.js"[^>]*>[\s\S]*?<\/script>/,
    )?.[0];
    expect(script).toBeDefined();
    expect(script).not.toMatch(/\b(?:async|defer|type)=?/);
    expect(script).toMatch(/><\/script>$/);
    expect(layout.indexOf(script!)).toBeLessThan(layout.indexOf("</head>"));
    expect(layout).not.toMatch(/<script is:inline>\s*\(\(\) =>/);
  });
  it("serves deterministic JS with explicit MIME, revalidation and no public bypass", async () => {
    expect(existsSync("src/pages/preferences-init.js.ts")).toBe(true);
    expect(existsSync("public/preferences-init.js")).toBe(false);
    const path = "../../src/pages/preferences-init.js.ts";
    const { GET } = await import(path);
    const response: Response = await GET({});
    expect(response.headers.get("Content-Type")).toBe(
      "text/javascript; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=0, must-revalidate",
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const source = await response.text();
    const root = {
      dataset: {} as Record<string, string>,
      style: {
        setProperty: (key: string, value: string) => {
          style[key] = value;
        },
      },
    };
    const style: Record<string, string> = {};
    runInNewContext(source, {
      document: { documentElement: root },
      window: {
        localStorage: {
          getItem: (key: string) => (key === "atlas-theme" ? "dark" : "9"),
        },
      },
    });
    expect(root.dataset).toEqual({ theme: "dark", fontScale: "1.5" });
    expect(style["--font-scale"]).toBe("1.5");
    runInNewContext(source, {
      document: { documentElement: root },
      window: {
        get localStorage() {
          throw new Error("blocked");
        },
      },
    });
    expect(root.dataset).toEqual({ theme: "dark", fontScale: "1" });
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|https?:/);
  });
  it("keeps only player and challenge origins without executable inline permission", async () => {
    expect(existsSync("src/lib/ui/public-security-policy.ts")).toBe(true);
    const path = "../../src/lib/ui/public-security-policy.ts";
    const { PUBLIC_CSP, PUBLIC_HEADERS, isExecutableScript } = await import(
      path
    );
    const directives = Object.fromEntries(
      PUBLIC_CSP.split(";").map((item: string) => {
        const [name, ...values] = item.trim().split(/\s+/);
        return [name, values];
      }),
    );
    expect(directives["script-src"]).toEqual([
      "'self'",
      "https://www.youtube.com",
      "https://s.ytimg.com",
      "https://challenges.cloudflare.com",
    ]);
    expect(directives["frame-src"]).toEqual([
      "https://www.youtube-nocookie.com",
      "https://streamable.com",
      "https://challenges.cloudflare.com",
    ]);
    expect(directives["connect-src"]).toEqual(["'self'"]);
    expect(PUBLIC_HEADERS).toContain(
      "/preferences-init.js\n  Content-Type: text/javascript; charset=utf-8\n  Cache-Control: public, max-age=0, must-revalidate",
    );
    expect(isExecutableScript({})).toBe(true);
    expect(isExecutableScript({ type: "module" })).toBe(true);
    expect(isExecutableScript({ type: "application/ld+json" })).toBe(false);
  });
});
