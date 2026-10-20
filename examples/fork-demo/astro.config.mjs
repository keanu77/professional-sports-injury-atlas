import { defineConfig } from "astro/config";

// Separate root: never import the atlas content, public assets, or release hooks.
export default defineConfig({
  output: "static",
  trailingSlash: "always",
  build: { inlineStylesheets: "always" },
  devToolbar: { enabled: false },
});
