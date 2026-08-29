import { type ReactNode, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/useLogout";
import { LanguageToggle } from "@/components/LanguageToggle";

export interface DashboardNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export function DashboardShell({
  navItems,
  sectionLabel,
  topBarExtra,
}: {
  navItems: DashboardNavItem[];
  sectionLabel: string;
  topBarExtra?: ReactNode;
}) {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userName = session?.user.name ?? "";

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-4">
        <Link to="/" className="text-lg font-extrabold text-brand-600">
          {t("appName")}
        </Link>
      </div>
      <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{sectionLabel}</div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100"
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium text-neutral-700">{userName}</span>
        </div>
        <button
          onClick={() => void logout()}
          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          {t("nav.logout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-60 flex-col border-e border-neutral-200 bg-white md:flex">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-64 flex-col bg-white">{sidebarContent}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <button className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 md:hidden" onClick={() => setMobileOpen(true)} aria-label="open menu">
            <Menu size={20} />
          </button>
          <span className="hidden text-sm text-neutral-500 md:block">{sectionLabel}</span>
          <div className="flex items-center gap-3">
            {topBarExtra}
            <LanguageToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <button
          // Anchored to the drawer's own outer edge (start-64 = right after its
          // w-64 width) rather than the viewport's far edge, so it sits next to
          // the drawer in both LTR and RTL instead of floating across the scrim.
          className="fixed start-64 top-4 z-50 ms-3 rounded-full bg-white p-2 shadow md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="close menu"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
