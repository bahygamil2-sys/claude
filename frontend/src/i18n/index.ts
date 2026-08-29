import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import common_ar from "./locales/ar/common.json";
import common_en from "./locales/en/common.json";

export const SUPPORTED_LANGUAGES = ["ar", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n.use(initReactI18next).init({
  resources: {
    ar: { common: common_ar },
    en: { common: common_en },
  },
  lng: "ar",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common"],
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
