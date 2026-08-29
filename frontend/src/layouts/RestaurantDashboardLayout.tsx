import { useTranslation } from "react-i18next";
import { BarChart3, ClipboardList, LayoutGrid, Settings, UtensilsCrossed } from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import { RestaurantPicker } from "@/features/restaurant-dashboard/RestaurantPicker";

export function RestaurantDashboardLayout() {
  const { t } = useTranslation();

  const navItems = [
    { to: "/restaurant-dashboard", end: true, label: t("restaurant:nav.overview"), icon: <LayoutGrid size={17} /> },
    { to: "/restaurant-dashboard/orders", label: t("restaurant:nav.orders"), icon: <ClipboardList size={17} /> },
    { to: "/restaurant-dashboard/menu", label: t("restaurant:nav.menu"), icon: <UtensilsCrossed size={17} /> },
    { to: "/restaurant-dashboard/reports", label: t("restaurant:nav.reports"), icon: <BarChart3 size={17} /> },
    { to: "/restaurant-dashboard/settings", label: t("restaurant:nav.settings"), icon: <Settings size={17} /> },
  ];

  return <DashboardShell navItems={navItems} sectionLabel={t("nav.restaurantDashboard")} topBarExtra={<RestaurantPicker />} />;
}
