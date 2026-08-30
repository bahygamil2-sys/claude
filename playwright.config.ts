import { defineConfig, devices } from "@playwright/test";

// `npm run dev` (backend :4000 + frontend :5173) must already be running —
// this config doesn't manage that lifecycle itself, matching how the rest of
// the project's verification scripts assume a dev session is already up.
export default defineConfig({
  testDir: "./e2e",
  // The golden-path test is intentionally one long journey (signup, branches,
  // a survey with 3 questions, publish, an anonymous submission in a second
  // context, a third mobile-viewport context, analytics, export, and an admin
  // suspend flow) — well beyond Playwright's 30s default.
  timeout: 120_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
        },
      },
    },
  ],
});
