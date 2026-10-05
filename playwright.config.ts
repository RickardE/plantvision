import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
// The cloud dev container ships Chromium outside Playwright's cache; CI installs its own.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

/**
 * End-to-end tests run against a production build with local Supabase (seeded with
 * `pnpm db:reset && pnpm seed:demo`) and the mock AI provider. Every flow runs on a phone
 * and on a desktop viewport, since the app is mobile first but used on both.
 */
export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    locale: "sv-SE",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // A UTF-8 locale lets Chromium keep Swedish characters in download file names.
    launchOptions: { executablePath, env: { ...process.env, LANG: process.env.LANG || "C.UTF-8" } },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "phone", use: { ...devices["Pixel 7"] }, dependencies: ["setup"] },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm start --port ${PORT}`,
        url: `${baseURL}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { AI_PROVIDER: "mock", MOCK_AI_DELAY_MS: "300" },
      },
});
