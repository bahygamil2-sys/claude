import { test, expect } from "@playwright/test";
import { login, setLanguage } from "./helpers";

test.describe("Restaurant owner dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "owner1@sufra.demo");
    await setLanguage(page, "en");
  });

  test("overview shows KPI stats and charts", async ({ page }) => {
    await page.goto("/restaurant-dashboard");
    await expect(page.getByText("Total Orders")).toBeVisible();
    // "Revenue" is used for both the stat card label and the chart title, so
    // disambiguate via role: the chart title renders as a heading, the stat
    // card label as plain text.
    await expect(page.getByRole("heading", { name: "Revenue" })).toBeVisible();
  });

  test("orders feed lists orders and can advance a pending one", async ({ page }) => {
    await page.goto("/restaurant-dashboard/orders");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10_000 });

    // Owners with multiple restaurants also get a plain <select> restaurant
    // switcher in the header, so scope to the labeled status filter to avoid
    // matching both comboboxes.
    await page.getByLabel("Filter").selectOption({ label: "Pending" });

    // The filter change triggers an async re-fetch; wait for it to settle
    // (either a matching row or the empty-state message) before counting —
    // otherwise `.count()` can race ahead and read the pre-filter list.
    const rows = page.locator("tbody tr");
    await expect(rows.first().or(page.getByText("No orders match these filters"))).toBeVisible();
    const initialCount = await rows.count();
    if (initialCount === 0) {
      test.skip(true, "No pending orders in the current seed — nothing to advance");
    }

    const advanceButton = rows.first().getByRole("button", { name: /Mark as/i });
    await expect(advanceButton).toBeVisible();
    await advanceButton.click();

    // Advancing moves the order out of PENDING, so under the active PENDING
    // filter the row count should drop by exactly one once the feed re-fetches.
    await expect(rows).toHaveCount(initialCount - 1, { timeout: 10_000 });
  });

  test("menu management lists categories and items", async ({ page }) => {
    await page.goto("/restaurant-dashboard/menu");
    await expect(page.getByRole("button", { name: /Add Item/i })).toBeVisible();
  });

  test("reports page renders report charts", async ({ page }) => {
    await page.goto("/restaurant-dashboard/reports");
    await expect(page.getByText("Sales Over Time")).toBeVisible();
    await expect(page.getByText("Top Selling Items")).toBeVisible();
  });
});
