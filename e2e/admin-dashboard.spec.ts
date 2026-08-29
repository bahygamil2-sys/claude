import { test, expect } from "@playwright/test";
import { login, setLanguage } from "./helpers";

test.describe("Admin dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@sufra.demo");
    await setLanguage(page, "en");
  });

  test("overview shows platform KPIs and live activity", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Total Orders")).toBeVisible();
    await expect(page.getByText("Live Activity")).toBeVisible();
  });

  test("restaurants page lists restaurants with status filters", async ({ page }) => {
    await page.goto("/admin/restaurants");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("tbody tr")).toHaveCount(10);
  });

  test("users page lists seeded users across roles", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("admin@sufra.demo")).toBeVisible();
  });

  test("categories page lists categories and supports create + delete", async ({ page }) => {
    await page.goto("/admin/categories");
    await expect(page.getByRole("button", { name: "Add Category" })).toBeVisible();

    await page.getByRole("button", { name: "Add Category" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel("Name (English)").fill("E2E Test Cuisine");
    await modal.getByLabel("Name (Arabic)").fill("مطبخ اختبار");
    await modal.getByRole("button", { name: "Save" }).click();
    await expect(modal).toBeHidden();

    const card = page.getByTestId("category-card").filter({ hasText: "E2E Test Cuisine" });
    await expect(card).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await card.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("E2E Test Cuisine")).toBeHidden();
  });

  test("reports page renders all platform report charts", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.getByText("Top Restaurants")).toBeVisible();
    await expect(page.getByText("Top Categories")).toBeVisible();
    await expect(page.getByText("Orders by Status")).toBeVisible();
    await expect(page.getByText("New Signups")).toBeVisible();
  });
});
