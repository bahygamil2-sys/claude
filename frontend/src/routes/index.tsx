import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { RestaurantDashboardLayout } from "@/layouts/RestaurantDashboardLayout";
import { AdminDashboardLayout } from "@/layouts/AdminDashboardLayout";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import HomePage from "@/features/home/HomePage";
import RestaurantListPage from "@/features/restaurants/RestaurantListPage";
import RestaurantDetailPage from "@/features/restaurants/RestaurantDetailPage";
import CartPage from "@/features/cart/CartPage";
import CheckoutPage from "@/features/checkout/CheckoutPage";
import CustomerOrdersListPage from "@/features/orders/CustomerOrdersListPage";
import CustomerOrderDetailPage from "@/features/orders/CustomerOrderDetailPage";
import ProfilePage from "@/features/profile/ProfilePage";
import OrderTrackingPage from "@/features/tracking/OrderTrackingPage";
import { RestaurantDashboardProvider } from "@/features/restaurant-dashboard/RestaurantDashboardContext";
import RestaurantOverviewPage from "@/features/restaurant-dashboard/RestaurantOverviewPage";
import RestaurantOrdersFeedPage from "@/features/restaurant-dashboard/RestaurantOrdersFeedPage";
import RestaurantOrderDetailPage from "@/features/restaurant-dashboard/RestaurantOrderDetailPage";
import MenuManagementPage from "@/features/restaurant-dashboard/MenuManagementPage";
import RestaurantReportsPage from "@/features/restaurant-dashboard/RestaurantReportsPage";
import RestaurantSettingsPage from "@/features/restaurant-dashboard/RestaurantSettingsPage";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantListPage />} />
        <Route path="/restaurants/:slug" element={<RestaurantDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <CustomerOrdersListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <CustomerOrderDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id/tracking"
          element={
            <RequireAuth>
              <OrderTrackingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
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
            <RestaurantDashboardProvider>
              <RestaurantDashboardLayout />
            </RestaurantDashboardProvider>
          </RequireRole>
        }
      >
        <Route index element={<RestaurantOverviewPage />} />
        <Route path="orders" element={<RestaurantOrdersFeedPage />} />
        <Route path="orders/:id" element={<RestaurantOrderDetailPage />} />
        <Route path="menu" element={<MenuManagementPage />} />
        <Route path="reports" element={<RestaurantReportsPage />} />
        <Route path="settings" element={<RestaurantSettingsPage />} />
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
