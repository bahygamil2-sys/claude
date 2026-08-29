import { useTranslation } from "react-i18next";
import { BarChart3, ClipboardList, LayoutGrid, Store, Tag, Users } from "lucide-react";
import { DashboardShell } from "./DashboardShell";

export function AdminDashboardLayout() {
  const { t } = useTranslation();

  const navItems = [
    { to: "/admin", end: true, label: t("admin:nav.overview"), icon: <LayoutGrid size={17} /> },
    { to: "/admin/restaurants", label: t("admin:nav.restaurants"), icon: <Store size={17} /> },
    { to: "/admin/users", label: t("admin:nav.users"), icon: <Users size={17} /> },
    { to: "/admin/categories", label: t("admin:nav.categories"), icon: <Tag size={17} /> },
    { to: "/admin/orders", label: t("admin:nav.orders"), icon: <ClipboardList size={17} /> },
    { to: "/admin/reports", label: t("admin:nav.reports"), icon: <BarChart3 size={17} /> },
  ];

  return <DashboardShell navItems={navItems} sectionLabel={t("nav.adminDashboard")} />;
}
