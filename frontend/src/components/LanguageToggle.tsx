import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useUIStore } from "@/store/uiStore";
import type { SupportedLanguage } from "@/i18n";

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);

  function switchTo(lang: SupportedLanguage) {
    setLanguage(lang);
    void i18n.changeLanguage(lang);
  }

  return (
    <div className={clsx("inline-flex items-center rounded-full border border-neutral-300 bg-white p-0.5 text-xs font-semibold", className)}>
      <button
        onClick={() => switchTo("ar")}
        className={clsx("rounded-full px-2.5 py-1 transition-colors", language === "ar" ? "bg-brand-600 text-white" : "text-neutral-500")}
      >
        عربي
      </button>
      <button
        onClick={() => switchTo("en")}
        className={clsx("rounded-full px-2.5 py-1 transition-colors", language === "en" ? "bg-brand-600 text-white" : "text-neutral-500")}
      >
        EN
      </button>
    </div>
  );
}
