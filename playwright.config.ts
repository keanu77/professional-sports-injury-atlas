import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.ATLAS_E2E_PORT ?? "4321");
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("ATLAS_E2E_PORT must be an integer between 1024 and 65535");
}
const origin = `http://127.0.0.1:${port}`;

// The review artifact is built before preview so browser tests always run
// against the exact static output, never a dev server.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  webServer: {
    command: `npm run build:review && npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: `${origin}/`,
    reuseExistingServer: false,
    timeout: 300000,
  },
  use: {
    baseURL: origin,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
