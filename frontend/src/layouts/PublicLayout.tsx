import { useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useLogout } from "@/features/auth/useLogout";
import { useClickOutside } from "@/hooks/useClickOutside";
import { LanguageToggle } from "@/components/LanguageToggle";

function CartIcon() {
  const count = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.quantity, 0));
  return (
    <Link to="/cart" className="relative rounded-full p-2 text-neutral-600 hover:bg-neutral-100" aria-label="cart">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
          {t("nav.login")}
        </Link>
        <Link to="/register" className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          {t("nav.register")}
        </Link>
      </div>
    );
  }

  const dashboardLink =
    user.role === "ADMIN" ? { to: "/admin", label: t("nav.adminDashboard") } : user.role === "RESTAURANT_OWNER" ? { to: "/restaurant-dashboard", label: t("nav.restaurantDashboard") } : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 py-1 ps-1 pe-3 text-sm font-medium hover:bg-neutral-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[8rem] truncate">{user.name}</span>
      </button>
      {open && (
        <div className="absolute end-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
          {dashboardLink && (
            <Link to={dashboardLink.to} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              {dashboardLink.label}
            </Link>
          )}
          <Link to="/orders" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            {t("nav.orders")}
          </Link>
          <Link to="/profile" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            {t("nav.profile")}
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="block w-full px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50"
          >
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export function PublicLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-600">
            {t("appName")}
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                clsx("rounded-lg px-3 py-1.5 text-sm font-medium", isActive ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100")
              }
            >
              {t("nav.home")}
            </NavLink>
            <NavLink
              to="/restaurants"
              className={({ isActive }) =>
                clsx("rounded-lg px-3 py-1.5 text-sm font-medium", isActive ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100")
              }
            >
              {t("nav.restaurants")}
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <CartIcon />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-50 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-neutral-500 sm:px-6">
          {t("appName")} — {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
