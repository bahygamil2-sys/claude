import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import common_ar from "./locales/ar/common.json";
import common_en from "./locales/en/common.json";
import auth_ar from "./locales/ar/auth.json";
import auth_en from "./locales/en/auth.json";
import dashboard_ar from "./locales/ar/dashboard.json";
import dashboard_en from "./locales/en/dashboard.json";
import survey_ar from "./locales/ar/survey.json";
import survey_en from "./locales/en/survey.json";

export const SUPPORTED_LANGUAGES = ["ar", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n.use(initReactI18next).init({
  resources: {
    ar: { common: common_ar, auth: auth_ar, dashboard: dashboard_ar, survey: survey_ar },
    en: { common: common_en, auth: auth_en, dashboard: dashboard_en, survey: survey_en },
  },
  lng: "ar",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "auth", "dashboard", "survey"],
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
