import { useTranslation } from "react-i18next";
import { Building2, ClipboardList, LayoutGrid, Settings, Users } from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import { useAuthStore } from "@/store/authStore";

export function BrandDashboardLayout() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const isOwner = session?.actorType === "BRAND_USER" && session.user.role === "OWNER";

  const navItems = [
    { to: "/dashboard", end: true, label: t("nav.dashboard"), icon: <LayoutGrid size={17} /> },
    { to: "/branches", label: t("nav.branches"), icon: <Building2 size={17} /> },
    { to: "/surveys", label: t("nav.surveys"), icon: <ClipboardList size={17} /> },
    // Team management is Owner-only end to end (see backend brandUsers.routes.ts) —
    // hidden here for Manager rather than shown-then-403'd.
    ...(isOwner ? [{ to: "/team", label: t("nav.team"), icon: <Users size={17} /> }] : []),
    { to: "/settings", label: t("nav.settings"), icon: <Settings size={17} /> },
  ];

  return <DashboardShell navItems={navItems} sectionLabel={t("nav.dashboard")} />;
}
