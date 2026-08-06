import { defineConfig, devices } from "@playwright/test";

// The review artifact is built before preview so browser tests always run
// against the exact static output, never a dev server.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  webServer: {
    command:
      "npm run build:review && npm run preview -- --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321/",
    reuseExistingServer: true,
    timeout: 300000,
  },
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
