import type { Page } from "@playwright/test";

export const SEEDED_PASSWORD = "Passw0rd!";

export async function login(page: Page, email: string, password = SEEDED_PASSWORD) {
  await page.goto("/login");
  // Field labels are language-dependent (AR is the default), but the input
  // `type` attribute is stable — safer to target than label text here.
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 10_000 });
}

export async function setLanguage(page: Page, lang: "ar" | "en") {
  const label = lang === "ar" ? "عربي" : "EN";
  await page.getByRole("button", { name: label, exact: true }).click();
}
