import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import common_ar from "./locales/ar/common.json";
import common_en from "./locales/en/common.json";
import auth_ar from "./locales/ar/auth.json";
import auth_en from "./locales/en/auth.json";
import restaurant_ar from "./locales/ar/restaurant.json";
import restaurant_en from "./locales/en/restaurant.json";
import admin_ar from "./locales/ar/admin.json";
import admin_en from "./locales/en/admin.json";

export const SUPPORTED_LANGUAGES = ["ar", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n.use(initReactI18next).init({
  resources: {
    ar: { common: common_ar, auth: auth_ar, restaurant: restaurant_ar, admin: admin_ar },
    en: { common: common_en, auth: auth_en, restaurant: restaurant_en, admin: admin_en },
  },
  lng: "ar",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "auth", "restaurant", "admin"],
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
