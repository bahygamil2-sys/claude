import { test, expect } from "@playwright/test";
import { login, setLanguage } from "./helpers";

test.describe("Customer ordering flow", () => {
  test("defaults to Arabic/RTL and can toggle to English/LTR", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await setLanguage(page, "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("customer can browse, order, and see the order in history", async ({ page }) => {
    await login(page, "customer1@sufra.demo");
    await setLanguage(page, "en");

    // Browse: filter to a city that's guaranteed to have approved restaurants.
    await page.goto("/restaurants?city=Cairo");
    const firstCard = page.locator("main a[href^='/restaurants/']").first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Detail page: open the first orderable (non-disabled) menu item.
    await page.waitForURL(/\/restaurants\/[^/]+$/);
    const menuItemCard = page.getByTestId("menu-item-card").and(page.locator(":not([disabled])")).first();
    await expect(menuItemCard).toBeVisible();
    await menuItemCard.click();

    // Add-to-cart modal. The item we landed on is whichever happens to be
    // first, so it may carry required option groups (e.g. a pizza's size) —
    // pick the first choice in every group present. Selecting a default is a
    // normal, valid action for optional groups too, so this is safe generally.
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    const optionGroups = modal.getByTestId("option-group-choices");
    const groupCount = await optionGroups.count();
    for (let i = 0; i < groupCount; i++) {
      await optionGroups.nth(i).locator("input").first().click();
    }

    // Bump quantity so the order clears any minimum-order threshold
    // regardless of which item/restaurant we landed on.
    const increment = modal.getByTestId("quantity-increment");
    for (let i = 0; i < 4; i++) await increment.click();
    await modal.getByRole("button", { name: /Add to Cart/i }).click();
    await expect(modal).toBeHidden();

    // Cart: navigate via the header icon (client-side transition) rather than
    // a full page load — a fresh dev server can be slow to serve a cold route.
    await page.getByLabel("cart").click();
    await page.waitForURL("/cart");
    const checkoutButton = page.getByRole("button", { name: "Go to Checkout" });
    await expect(checkoutButton).toBeEnabled();
    await checkoutButton.click();

    // Checkout: seeded customers have a default address and CASH is
    // preselected, so placing the order needs no further input.
    await page.waitForURL("/checkout");
    await expect(page.getByText("Delivery Address")).toBeVisible();
    const placeOrderButton = page.getByRole("button", { name: "Place Order" });
    await expect(placeOrderButton).toBeEnabled();
    await placeOrderButton.click();

    // Confirmation: redirected to the new order's detail page.
    await page.waitForURL(/\/orders\/[a-f0-9-]+$/, { timeout: 15_000 });
    await expect(page.getByText(/ORD-/)).toBeVisible();

    // History: the same order appears in "My Orders". A full navigation is
    // fine here — by this point in the test the shared chunks are warm.
    await page.goto("/orders");
    await expect(page.getByText(/ORD-/).first()).toBeVisible();
  });
});
