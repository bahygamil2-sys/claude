import { useTranslation } from "react-i18next";
import { LayoutGrid, Store } from "lucide-react";
import { DashboardShell } from "./DashboardShell";

export function AdminDashboardLayout() {
  const { t } = useTranslation();

  const navItems = [
    { to: "/admin/dashboard", end: true, label: t("nav.adminOverview"), icon: <LayoutGrid size={17} /> },
    { to: "/admin/brands", label: t("nav.brands"), icon: <Store size={17} /> },
  ];

  return <DashboardShell navItems={navItems} sectionLabel={t("nav.adminOverview")} />;
}
