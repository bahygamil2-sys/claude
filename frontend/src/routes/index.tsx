import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { RestaurantDashboardLayout } from "@/layouts/RestaurantDashboardLayout";
import { AdminDashboardLayout } from "@/layouts/AdminDashboardLayout";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PlaceholderPage title="Home" />} />
        <Route path="/restaurants" element={<PlaceholderPage title="Restaurants" />} />
        <Route path="/restaurants/:slug" element={<PlaceholderPage title="Restaurant Detail" />} />
        <Route path="/cart" element={<PlaceholderPage title="Cart" />} />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <PlaceholderPage title="Checkout" />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <PlaceholderPage title="My Orders" />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <PlaceholderPage title="Order Detail" />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id/tracking"
          element={
            <RequireAuth>
              <PlaceholderPage title="Order Tracking" />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <PlaceholderPage title="Profile" />
            </RequireAuth>
          }
        />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/restaurant-dashboard"
        element={
          <RequireRole roles={["RESTAURANT_OWNER", "ADMIN"]}>
            <RestaurantDashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<PlaceholderPage title="Overview" />} />
        <Route path="orders" element={<PlaceholderPage title="Orders" />} />
        <Route path="orders/:id" element={<PlaceholderPage title="Order Detail" />} />
        <Route path="menu" element={<PlaceholderPage title="Menu" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRole roles={["ADMIN"]}>
            <AdminDashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<PlaceholderPage title="Overview" />} />
        <Route path="restaurants" element={<PlaceholderPage title="Restaurants" />} />
        <Route path="restaurants/:id" element={<PlaceholderPage title="Restaurant Detail" />} />
        <Route path="users" element={<PlaceholderPage title="Users" />} />
        <Route path="categories" element={<PlaceholderPage title="Categories" />} />
        <Route path="orders" element={<PlaceholderPage title="Orders" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
      </Route>

      <Route path="/unauthorized" element={<PlaceholderPage title="403 — Unauthorized" />} />
      <Route path="*" element={<PlaceholderPage title="404 — Not Found" />} />
    </Routes>
  );
}
