import { useTranslation } from "react-i18next";

/** Returns a `pick(en, ar)` helper for choosing the right side of a bilingual DB field. */
export function useLocalized() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  return (en: string, ar: string) => (isAr ? ar : en);
}
