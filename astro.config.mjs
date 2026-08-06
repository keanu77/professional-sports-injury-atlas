// Static-only output. No SSR adapter, sitemap integration, analytics,
// or remote image domain may be added while public release is closed.
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
});
