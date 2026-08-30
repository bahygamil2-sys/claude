import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3, Pencil, QrCode } from "lucide-react";
import clsx from "clsx";

export function SurveyNavTabs({ surveyId }: { surveyId: string }) {
  const { t } = useTranslation("survey");

  const items = [
    { to: `/surveys/${surveyId}/edit`, label: t("nav.builder"), icon: Pencil },
    { to: `/surveys/${surveyId}/links`, label: t("links.title"), icon: QrCode },
    { to: `/surveys/${surveyId}/analytics`, label: t("analytics.title"), icon: BarChart3 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
              isActive ? "border-brand-600 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            )
          }
        >
          <item.icon size={15} />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
