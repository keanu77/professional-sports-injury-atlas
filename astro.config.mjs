// Pages remain static; the two same-origin playback statistics endpoints
// are handled separately by Cloudflare Pages Functions after public launch.
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  build: {
    // The complete editorial stylesheet is small; inlining it removes the
    // render-blocking round trip while local fonts continue to use swap.
    inlineStylesheets: "always",
  },
});
