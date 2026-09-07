// Pages remain static; the two same-origin playback statistics endpoints
// are handled separately by Cloudflare Pages Functions after public launch.
import { defineConfig } from "astro/config";
import { writeFile } from "node:fs/promises";
import { renderPublicSitemap } from "./src/lib/governance/sitemap.ts";

const publicSitemap = {
  name: "atlas-public-sitemap",
  hooks: {
    "astro:config:setup": ({ injectRoute }) => {
      if (
        process.env.ATLAS_BUILD_MODE === "public" &&
        process.env.ATLAS_PUBLIC_LAUNCH === "decision-21"
      ) {
        injectRoute({
          pattern: "/sitemap.xml",
          entrypoint: new URL(
            "./src/routes/public-sitemap.ts",
            import.meta.url,
          ),
          prerender: true,
        });
      }
    },
    "astro:build:done": async ({ pages, dir }) => {
      if (
        process.env.ATLAS_BUILD_MODE !== "public" ||
        process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21"
      )
        return;
      const sitemap = renderPublicSitemap(
        pages.map((page) => page.pathname),
        "https://injury.sportsmedicine.tw",
      );
      await writeFile(new URL("sitemap.xml", dir), sitemap, "utf8");
    },
  },
};

export default defineConfig({
  integrations: [publicSitemap],
  output: "static",
  trailingSlash: "always",
  build: {
    // The complete editorial stylesheet is small; inlining it removes the
    // render-blocking round trip while local fonts continue to use swap.
    inlineStylesheets: "always",
  },
  vite: {
    build: {
      // Keep executable JavaScript as same-origin assets so the public CSP does
      // not need script-src 'unsafe-inline'. Other small assets retain Vite's
      // normal inlining decision.
      assetsInlineLimit: (filePath) =>
        /\.(?:[cm]?js|tsx?)$/i.test(filePath) ? false : undefined,
    },
  },
});
