import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      thresholds: {
        "src/lib/cases/**": {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
