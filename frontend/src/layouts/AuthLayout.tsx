import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/LanguageToggle";

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 py-10">
      <div className="flex w-full max-w-sm items-center justify-between">
        <Link to="/" className="text-xl font-extrabold text-brand-600">
          {t("appName")}
        </Link>
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}
