import { defineConfig, devices } from "@playwright/test";

// Requires the app already running (`npm run dev`) against a migrated + seeded
// database — see README "Running the E2E tests" for the full prerequisites.
// This suite does not manage the dev servers or the database itself, since both
// depend on Postgres being reachable, which this config has no way to arrange.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  // These are real multi-step user journeys against a real dev server (login,
  // navigate, mutate, wait for a re-fetch) — comfortably over the 30s default.
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // A dev-mode Vite server can take a while to compile+serve a route it
    // hasn't seen yet in the current process, which is slower than a typical
    // production page load. Give navigations more headroom than the 30s default.
    navigationTimeout: 45_000,
    launchOptions: {
      // Optional override for environments where the default Playwright browser
      // resolution doesn't apply (e.g. a sandboxed CI image with a pre-installed
      // Chromium at a nonstandard path). Leave unset for normal local use after
      // `npx playwright install`.
      executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
